import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Textarea } from '@/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Avatar, AvatarFallback } from '@/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Alert, AlertDescription } from '@/ui/alert';
import { Separator } from '@/ui/separator';
import {
  ArrowLeft,
  Send,
  Loader2,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings,
  MessageSquare,
  FileIcon,
  Image as ImageIcon,
  FileText,
  Download
} from 'lucide-react';

const TicketDetail = ({ ticketId, onBack }) => {
  const { user, API_BASE_URL } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [assignedAgent, setAssignedAgent] = useState('');
  const [agents, setAgents] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  useEffect(() => {
    if (ticketData) {
      fetchMessages();
      if (user?.role === 'admin') {
        fetchAgents();
      }
    }
  }, [ticketData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTicket = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTicketData(data);
      } else {
        setError('Ошибка при загрузке заявки');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      setError('Ошибка при загрузке сообщений');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data.filter(u => u.role === 'agent'));
      }
    } catch (error) {
      console.error('Ошибка при загрузке агентов:', error);
    }
  };

  const handleAttachmentChange = (files) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Файл ${file.name} имеет неподдерживаемый формат`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`Файл ${file.name} превышает максимальный размер 5MB`);
        return false;
      }
      return true;
    });

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachments.length) return;

    setSendingMessage(true);
    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        setNewMessage('');
        setAttachments([]);
        await fetchMessages();
        scrollToBottom();
      } else {
        const data = await response.json();
        setError(data.error || 'Ошибка при отправке сообщения');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setSendingMessage(false);
    }
  };

  const updateTicketStatus = async (status) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicketData(updatedTicket);
        setError('');
      } else {
        setError('Ошибка при обновлении статуса');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const assignAgent = async (agentId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ agent_id: parseInt(agentId) }),
      });

      if (response.ok) {
        const updatedTicket = await response.json();
        setTicketData(updatedTicket);
        setError('');
      } else {
        setError('Ошибка при назначении исполнителя');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleDownload = async (path) => {
    try {
      const response = await fetch(`${API_BASE_URL}/uploads/tickets/${ticketId}/messages/${path}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = path.split('/').pop();
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Ошибка при скачивании файла');
      }
    } catch (error) {
      setError('Ошибка сети при скачивании файла');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending Moderation': { variant: 'outline', icon: AlertCircle, label: 'На модерации' },
      'Open': { variant: 'default', icon: AlertCircle, label: 'Открыта' },
      'In Progress': { variant: 'secondary', icon: Clock, label: 'В работе' },
      'Awaiting Customer Reply': { variant: 'outline', icon: User, label: 'Ожидает ответа заказчика' },
      'Awaiting Agent Reply': { variant: 'outline', icon: User, label: 'Ожидает ответа исполнителя' },
      'Resolved': { variant: 'default', icon: CheckCircle, label: 'Решена' },
      'Closed': { variant: 'destructive', icon: XCircle, label: 'Закрыта' },
    };

    const config = statusConfig[status?.name] || { variant: 'outline', icon: AlertCircle, label: status?.name };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'Low': { variant: 'outline', label: 'Низкий' },
      'Medium': { variant: 'secondary', label: 'Средний' },
      'High': { variant: 'default', label: 'Высокий' },
      'Critical': { variant: 'destructive', label: 'Критический' },
    };

    const config = priorityConfig[priority] || { variant: 'outline', label: priority };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canChangeStatus = () => {
    return user?.role === 'admin' || (user?.role === 'agent' && ticketData.agent_id === user.id);
  };

  const canAssignAgent = () => {
    return user?.role === 'admin';
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) {
      return <ImageIcon className="w-4 h-4" />;
    } else if (ext === 'pdf') {
      return <FileText className="w-4 h-4" />;
    } else {
      return <FileIcon className="w-4 h-4" />;
    }
  };

  if (!ticketData) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Загрузка заявки...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к заявкам
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start mb-4">
              <div>
                <CardTitle className="text-2xl font-bold mb-2">{ticketData.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {formatDate(ticketData.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getPriorityBadge(ticketData.priority)}
                {getStatusBadge(ticketData.status)}
              </div>
            </div>

            <div className="space-y-4">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                {ticketData.description}
              </div>
              
              {ticketData.attachments && ticketData.attachments.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/10">
                  <h3 className="text-sm font-medium mb-3">Вложения:</h3>
                  <div className="space-y-2">
                    {ticketData.attachments.map((filename, index) => (
                      <div key={index} 
                           className="flex items-center justify-between p-2 bg-background border rounded-md">
                        <div className="flex items-center gap-2">
                          {getFileIcon(filename)}
                          <span className="text-sm">{filename.split('_').pop()}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(filename)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Скачать
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {ticketData.customer?.username || 'Неизвестный пользователь'}
                  </span>
                </div>
                {ticketData.agent && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Исполнитель: {ticketData.agent.username}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Переписка
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="space-y-6 max-h-[400px] overflow-y-auto mb-4 p-4">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mb-4" />
                        <p>Сообщений пока нет. Начните переписку!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.sender_id === user?.id ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {message.sender?.username?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`flex flex-col gap-1 max-w-[70%] ${
                            message.sender_id === user?.id ? 'items-end' : 'items-start'
                          }`}>
                            <div className={`p-3 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-primary/20 space-y-2">
                                  {message.attachments.map((file, index) => (
                                    <div key={index}
                                      className="flex items-center gap-2 p-2 rounded bg-background/10">
                                      {getFileIcon(file)}
                                      <span className="text-xs truncate flex-1">{file.split('_').pop()}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownload(`${message.id}/${file}`)}
                                        className="h-6 px-2"
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{message.sender?.username}</span>
                              <span>•</span>
                              <span>{formatDate(message.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="border-t pt-4">
                    <form onSubmit={sendMessage} className="flex flex-col gap-3">
                      <div className="flex-1">
                        <Textarea
                          placeholder="Введите ваше сообщение..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={2}
                          className="min-h-[80px]"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage(e);
                            }
                          }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <input
                            type="file"
                            id="messageAttachment"
                            className="hidden"
                            multiple
                            onChange={(e) => handleAttachmentChange(e.target.files)}
                            accept="image/jpeg,image/png,image/gif,application/pdf,text/plain"
                          />
                          <label htmlFor="messageAttachment" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                            <ImageIcon className="w-4 h-4" />
                            Прикрепить файлы
                          </label>
                          <span className="text-xs text-muted-foreground">
                            Shift + Enter для новой строки
                          </span>
                        </div>
                      </div>
                      {attachments.length > 0 && (
                        <div className="space-y-2 p-2 border rounded-md bg-muted/10">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                {getFileIcon(file.name)}
                                <span className="truncate max-w-[200px]">{file.name}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                              >
                                Удалить
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={sendingMessage || (!newMessage.trim() && !attachments.length)}
                          className="flex items-center gap-2"
                        >
                          {sendingMessage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Отправка...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Отправить
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </>
              )}

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Card>

        {(canAssignAgent() || canChangeStatus()) && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            {canAssignAgent() && (
              <div className="flex-1">
                <Label htmlFor="agent">Назначить исполнителя</Label>
                <Select value={assignedAgent} onValueChange={(value) => {
                  setAssignedAgent(value);
                  assignAgent(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите исполнителя" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {canChangeStatus() && (
              <div className="flex-1">
                <Label htmlFor="status">Изменить статус</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => {
                    setNewStatus(value);
                    updateTicketStatus(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите статус" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Открыта</SelectItem>
                    <SelectItem value="In Progress">В работе</SelectItem>
                    <SelectItem value="Awaiting Customer Reply">Ожидает ответа заказчика</SelectItem>
                    <SelectItem value="Awaiting Agent Reply">Ожидает ответа исполнителя</SelectItem>
                    <SelectItem value="Resolved">Решена</SelectItem>
                    <SelectItem value="Closed">Закрыта</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetail;
