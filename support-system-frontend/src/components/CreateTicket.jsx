import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Alert, AlertDescription } from '@/ui/alert';
import { 
  Loader2, Plus, ArrowLeft, Image as ImageIcon, Bold, Italic, 
  List, ListOrdered, Link2, Quote, Code, Heading1, Heading2,
  Undo, Redo, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { useDropzone } from 'react-dropzone';

const CreateTicket = ({ onTicketCreated }) => {
  const { API_BASE_URL } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    attachments: []
  });
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2]
        }
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 hover:text-blue-700 underline',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      handleInputChange('description', editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none',
      },
    },
  });

  const setLink = useCallback(() => {
    const url = window.prompt('URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');  const [success, setSuccess] = useState(false);

  const handleEditorChange = (content) => {
    handleInputChange('description', content);
  };

  const addImage = useCallback(
    (file) => {
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          editor.chain().focus().setImage({ src: e.target.result }).run();
          // Also add to form attachments
          setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, file]
          }));
        };
        reader.readAsDataURL(file);
      }
    },
    [editor]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      acceptedFiles.forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          setError(`Файл ${file.name} имеет неподдерживаемый формат`);
          return;
        }
        if (file.size > maxSize) {
          setError(`Файл ${file.name} превышает максимальный размер 5MB`);
          return;
        }

        if (file.type.startsWith('image/')) {
          addImage(file);
        } else {
          setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, file]
          }));
        }
      });
    },
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxSize: 5 * 1024 * 1024
  });

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('priority', formData.priority);
    formData.attachments.forEach((file) => {
      formDataToSend.append('attachments', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: 'POST',
        credentials: 'include',
        body: formDataToSend,
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          if (onTicketCreated) onTicketCreated();
        }, 1200);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка при создании заявки');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onTicketCreated}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к заявкам
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Создать новую заявку
            </CardTitle>
            <CardDescription>
              Опишите вашу проблему или запрос. Наши специалисты свяжутся с вами в ближайшее время.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Заголовок заявки *</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Кратко опишите проблему"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Описание *</Label>
                <div className="flex flex-wrap gap-2 p-2 mb-2 border rounded-md bg-white sticky top-0 z-10 shadow-sm">
                  <div className="flex gap-1 items-center border-r pr-2 mr-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={editor.isActive('heading', { level: 1 }) ? 'bg-secondary' : ''}
                      title="Заголовок 1"
                    >
                      <Heading1 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={editor.isActive('heading', { level: 2 }) ? 'bg-secondary' : ''}
                      title="Заголовок 2"
                    >
                      <Heading2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex gap-1 items-center border-r pr-2 mr-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBold().run()}
                      className={editor.isActive('bold') ? 'bg-secondary' : ''}
                      title="Жирный"
                    >
                      <Bold className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleItalic().run()}
                      className={editor.isActive('italic') ? 'bg-secondary' : ''}
                      title="Курсив"
                    >
                      <Italic className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex gap-1 items-center border-r pr-2 mr-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBulletList().run()}
                      className={editor.isActive('bulletList') ? 'bg-secondary' : ''}
                      title="Маркированный список"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleOrderedList().run()}
                      className={editor.isActive('orderedList') ? 'bg-secondary' : ''}
                      title="Нумерованный список"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex gap-1 items-center border-r pr-2 mr-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleBlockquote().run()}
                      className={editor.isActive('blockquote') ? 'bg-secondary' : ''}
                      title="Цитата"
                    >
                      <Quote className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                      className={editor.isActive('codeBlock') ? 'bg-secondary' : ''}
                      title="Блок кода"
                    >
                      <Code className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex gap-1 items-center border-r pr-2 mr-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={setLink}
                      className={editor.isActive('link') ? 'bg-secondary' : ''}
                      title="Вставить ссылку"
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex gap-1 items-center border-r pr-2 mr-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().setTextAlign('left').run()}
                      className={editor.isActive({ textAlign: 'left' }) ? 'bg-secondary' : ''}
                      title="По левому краю"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().setTextAlign('center').run()}
                      className={editor.isActive({ textAlign: 'center' }) ? 'bg-secondary' : ''}
                      title="По центру"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().setTextAlign('right').run()}
                      className={editor.isActive({ textAlign: 'right' }) ? 'bg-secondary' : ''}
                      title="По правому краю"
                    >
                      <AlignRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex gap-1 items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().undo().run()}
                      disabled={!editor?.can().undo()}
                      title="Отменить"
                    >
                      <Undo className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor.chain().focus().redo().run()}
                      disabled={!editor?.can().redo()}
                      title="Повторить"
                    >
                      <Redo className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="relative">
                  <EditorContent 
                    editor={editor} 
                    className="min-h-[200px] border rounded-md p-3 prose prose-sm sm:prose lg:prose-lg max-w-none bg-white" 
                  />
                  <div 
                    {...getRootProps()} 
                    className="absolute inset-0 pointer-events-none border-2 border-dashed border-transparent transition-colors rounded-md"
                    style={{
                      pointerEvents: isDragActive ? 'auto' : 'none',
                      backgroundColor: isDragActive ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
                      borderColor: isDragActive ? 'rgba(0, 0, 0, 0.2)' : 'transparent'
                    }}
                  >
                    <input {...getInputProps()} />
                    {isDragActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                        <p>Перетащите файлы сюда</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Вложения</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                    <p>Перетащите файлы сюда или кликните для выбора</p>
                    <p className="text-sm text-gray-500">
                      Поддерживаемые форматы: JPG, PNG, GIF, PDF, TXT (макс. 5MB)
                    </p>
                  </div>
                </div>
                {formData.attachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Прикрепленные файлы:</Label>
                    <div className="space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(index)}
                          >
                            Удалить
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Приоритет</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите приоритет" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Низкий</SelectItem>
                    <SelectItem value="Medium">Средний</SelectItem>
                    <SelectItem value="High">Высокий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onTicketCreated}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.title || !formData.description}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    'Создать заявку'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateTicket;

