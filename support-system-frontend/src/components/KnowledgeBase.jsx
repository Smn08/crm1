import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Alert, AlertDescription } from '@/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Badge } from '@/ui/badge';
import { BookOpen, Plus, Search, Edit, Trash2, Eye } from 'lucide-react';

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [viewingArticle, setViewingArticle] = useState(null);
  
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: ''
  });

  const { user, API_BASE_URL } = useAuth();

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    try {
      let url = `${API_BASE_URL}/knowledgebase`;
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        setError('Ошибка загрузки статей');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/knowledgebase/categories`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/knowledgebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newArticle),
      });

      if (response.ok) {
        setSuccess('Статья успешно создана');
        setNewArticle({ title: '', content: '', category: '' });
        setIsCreateDialogOpen(false);
        fetchArticles();
        fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка создания статьи');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleUpdateArticle = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/knowledgebase/${editingArticle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editingArticle),
      });

      if (response.ok) {
        setSuccess('Статья успешно обновлена');
        setIsEditDialogOpen(false);
        setEditingArticle(null);
        fetchArticles();
        fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка обновления статьи');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!confirm('Вы уверены, что хотите удалить эту статью?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/knowledgebase/${articleId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Статья успешно удалена');
        fetchArticles();
        fetchCategories();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка удаления статьи');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleSearch = () => {
    fetchArticles();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setTimeout(() => fetchArticles(), 100);
  };

  const formatContent = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/^\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/\n/g, '<br>');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка базы знаний...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            База знаний
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Инструкции, FAQ и полезная информация
          </p>
        </div>
        
        {user?.role === 'admin' && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Создать статью
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Создать новую статью</DialogTitle>
                <DialogDescription>
                  Заполните форму для создания новой статьи в базе знаний
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateArticle} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-title">Заголовок</Label>
                  <Input
                    id="new-title"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({...newArticle, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-category">Категория</Label>
                  <Input
                    id="new-category"
                    value={newArticle.category}
                    onChange={(e) => setNewArticle({...newArticle, category: e.target.value})}
                    placeholder="Например: FAQ, Инструкции, Устранение неполадок"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="new-content">Содержание</Label>
                  <Textarea
                    id="new-content"
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({...newArticle, content: e.target.value})}
                    rows={15}
                    placeholder="Используйте Markdown для форматирования:&#10;# Заголовок 1&#10;## Заголовок 2&#10;**Жирный текст**&#10;* Список"
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Создать статью
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Поиск и фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Поиск по заголовку и содержанию</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Введите ключевые слова..."
              />
            </div>
            
            <div className="w-48">
              <Label htmlFor="category-filter">Категория</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все категории</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Поиск
            </Button>
            
            <Button variant="outline" onClick={clearFilters}>
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Articles Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                  <CardDescription className="mt-2">
                    <Badge variant="outline">{article.category}</Badge>
                  </CardDescription>
                </div>
                {user?.role === 'admin' && (
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingArticle({...article});
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteArticle(article.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {article.content.replace(/[#*]/g, '').substring(0, 150)}...
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Автор: {article.author?.username}</span>
                  <span>{new Date(article.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setViewingArticle(article);
                    setIsViewDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Читать
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Статьи не найдены
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Попробуйте изменить параметры поиска или создайте новую статью
            </p>
          </CardContent>
        </Card>
      )}

      {/* View Article Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {viewingArticle && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingArticle.title}</DialogTitle>
                <DialogDescription>
                  <Badge variant="outline" className="mr-2">{viewingArticle.category}</Badge>
                  Автор: {viewingArticle.author?.username} • {new Date(viewingArticle.created_at).toLocaleDateString('ru-RU')}
                </DialogDescription>
              </DialogHeader>
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: formatContent(viewingArticle.content) }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Article Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать статью</DialogTitle>
            <DialogDescription>
              Измените содержание статьи
            </DialogDescription>
          </DialogHeader>
          {editingArticle && (
            <form onSubmit={handleUpdateArticle} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Заголовок</Label>
                <Input
                  id="edit-title"
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({...editingArticle, title: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-category">Категория</Label>
                <Input
                  id="edit-category"
                  value={editingArticle.category}
                  onChange={(e) => setEditingArticle({...editingArticle, category: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-content">Содержание</Label>
                <Textarea
                  id="edit-content"
                  value={editingArticle.content}
                  onChange={(e) => setEditingArticle({...editingArticle, content: e.target.value})}
                  rows={15}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full">
                Обновить статью
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBase;

