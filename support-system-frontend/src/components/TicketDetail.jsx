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
  MessageSquare
} from 'lucide-react';

const TicketDetail = ({ ticketId, onBack, onUpdate }) => {
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
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTicket();
    // eslint-disable-next-line
  }, [ticketId]);

  useEffect(() => {
    if (ticketData) {
      fetchMessages();
      if (user?.role === 'admin') {
        fetchAgents();
      }
    }
    // eslint-disable-next-line
  }, [ticketData]);

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

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newMessage }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages();
      } else {
        setError('Ошибка при отправке сообщения');
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
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку
          </Button>
        </div>

        {/* Ticket Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">
                  #{ticketData.id} {ticketData.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {ticketData.description}
                </CardDescription>
              </div>
              <div className="flex flex-col gap-2 ml-4">
                {getStatusBadge(ticketData.status)}
                {getPriorityBadge(ticketData.priority)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-gray-500">Заказчик</Label>
                <p className="font-medium">{ticketData.customer?.username}</p>
              </div>
              <div>
                <Label className="text-gray-500">Исполнитель</Label>
                <p className="font-medium">
                  {ticketData.agent?.username || 'Не назначен'}
                </p>
              </div>
              <div>
                <Label className="text-gray-500">Создана</Label>
                <p className="font-medium">{formatDate(ticketData.created_at)}</p>
              </div>
            </div>

            {/* Admin Controls */}
            {(canChangeStatus() || canAssignAgent()) && (
              <>
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-4">
                  {canChangeStatus() && ticketData.status?.name !== 'Pending Moderation' && (
                    <div className="flex items-center gap-2">
                      <Label>Статус:</Label>
                      <Select
                        value={newStatus}
                        onValueChange={(value) => {
                          setNewStatus(value);
                          updateTicketStatus(value);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Изменить статус" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Не показываем 'Pending Moderation' для ручного выбора */}
                          <SelectItem value="In Progress">В работе</SelectItem>
                          <SelectItem value="Awaiting Customer Reply">Ожидает ответа заказчика</SelectItem>
                          <SelectItem value="Awaiting Agent Reply">Ожидает ответа исполнителя</SelectItem>
                          <SelectItem value="Resolved">Решена</SelectItem>
                          <SelectItem value="Closed">Закрыта</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {canAssignAgent() && (
                    <div className="flex items-center gap-2">
                      <Label>Исполнитель:</Label>
                      <Select
                        value={assignedAgent}
                        onValueChange={(value) => {
                          setAssignedAgent(value);
                          assignAgent(value);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Назначить исполнителя" />
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
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
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
                <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Сообщений пока нет. Начните переписку!
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_id === user?.id ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {message.sender?.username?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`flex-1 max-w-xs lg:max-w-md ${
                            message.sender_id === user?.id ? 'text-right' : ''
                          }`}
                        >
                          <div
                            className={`p-3 rounded-lg ${
                              message.sender_id === user?.id
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {message.sender?.username} • {formatDate(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="flex gap-2">
                  <Textarea
                    placeholder="Введите ваше сообщение..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                  />
                  <Button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketDetail;

