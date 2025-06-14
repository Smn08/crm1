import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Alert, AlertDescription } from '@/ui/alert';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

const TicketList = ({ onSelectTicket }) => {
  const { user, API_BASE_URL } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [customFilters, setCustomFilters] = useState(() => {
    const saved = localStorage.getItem(`customFilters_${user?.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCustomFilter, setSelectedCustomFilter] = useState('');
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchTickets();
    if (user?.role === 'admin' || user?.role === 'agent') fetchCompanies();
  }, [statusFilter, priorityFilter, agentFilter, sortOrder, companyFilter]);

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/companies/`, { credentials: 'include' });
      if (res.ok) setCompanies(await res.json());
    } catch {}
  };

  const fetchTickets = async () => {
    setLoading(true);
    setError('');

    try {
      let url = `${API_BASE_URL}/tickets?`;
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }
      if (agentFilter) {
        params.append('agent', agentFilter);
      }
      if ((user?.role === 'admin' || user?.role === 'agent') && companyFilter !== 'all') {
        params.append('company_id', companyFilter);
      }
      params.append('sort', sortOrder);

      const response = await fetch(`${url}${params.toString()}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else {
        setError('Ошибка при загрузке заявок');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending Moderation': { variant: 'outline', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'На модерации' },
      'Open': { variant: 'default', color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'Открыта' },
      'In Progress': { variant: 'secondary', color: 'bg-green-100 text-green-800', icon: Clock, label: 'В работе' },
      'Awaiting Customer Reply': { variant: 'outline', color: 'bg-orange-100 text-orange-800', icon: User, label: 'Ожидает ответа заказчика' },
      'Awaiting Agent Reply': { variant: 'outline', color: 'bg-orange-100 text-orange-800', icon: User, label: 'Ожидает ответа исполнителя' },
      'Resolved': { variant: 'default', color: 'bg-lime-100 text-lime-800', icon: CheckCircle, label: 'Решена' },
      'Closed': { variant: 'destructive', color: 'bg-gray-300 text-gray-700', icon: XCircle, label: 'Закрыта' },
    };

    const config = statusConfig[status?.name] || { variant: 'outline', icon: AlertCircle, label: status?.name };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={`flex items-center gap-1 ${config.color}`}>
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

  const filteredTickets = tickets.filter(ticket => {
    if ((user?.role === 'admin' || user?.role === 'agent') && companyFilter !== 'all') {
      return ticket.customer?.company?.id === Number(companyFilter) && (
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (user?.role === 'agent') {
      return ticket.agent_id === user.id && (
        ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const saveCustomFilter = () => {
    const name = prompt('Название фильтра:');
    if (!name) return;
    const newFilter = {
      name,
      status: statusFilter,
      priority: priorityFilter,
      search: searchTerm
    };
    const updated = [...customFilters, newFilter];
    setCustomFilters(updated);
    localStorage.setItem(`customFilters_${user?.id}` , JSON.stringify(updated));
  };
  const applyCustomFilter = (name) => {
    const filter = customFilters.find(f => f.name === name);
    if (filter) {
      setStatusFilter(filter.status);
      setPriorityFilter(filter.priority);
      setSearchTerm(filter.search);
      setSelectedCustomFilter(name);
    }
  };
  const deleteCustomFilter = (name) => {
    const updated = customFilters.filter(f => f.name !== name);
    setCustomFilters(updated);
    localStorage.setItem(`customFilters_${user?.id}` , JSON.stringify(updated));
    setSelectedCustomFilter('');
  };

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Заявки</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === 'customer' && 'Ваши заявки в службу поддержки'}
            {user?.role === 'agent' && 'Заявки для обработки'}
            {user?.role === 'admin' && 'Все заявки в системе'}
          </p>
        </div>
        <Button onClick={fetchTickets} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Поиск по заголовку или описанию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="Pending Moderation">На модерации</SelectItem>
            <SelectItem value="Open">Открыта</SelectItem>
            <SelectItem value="In Progress">В работе</SelectItem>
            <SelectItem value="Awaiting Customer Reply">Ожидает ответа заказчика</SelectItem>
            <SelectItem value="Awaiting Agent Reply">Ожидает ответа исполнителя</SelectItem>
            <SelectItem value="Resolved">Решена</SelectItem>
            <SelectItem value="Closed">Закрыта</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Приоритет" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все приоритеты</SelectItem>
            <SelectItem value="Low">Низкий</SelectItem>
            <SelectItem value="Medium">Средний</SelectItem>
            <SelectItem value="High">Высокий</SelectItem>
            <SelectItem value="Critical">Критический</SelectItem>
          </SelectContent>
        </Select>
        {/* Кастомный фильтр по исполнителю для админа */}
        {user?.role === 'admin' && (
          <Input
            placeholder="Фильтр по исполнителю..."
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            className="w-full sm:w-48"
          />
        )}
        {/* Фильтр по компании для админа и исполнителя */}
        {(user?.role === 'admin' || user?.role === 'agent') && (
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Компания" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все компании</SelectItem>
              {companies.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {/* Кастомная сортировка по дате */}
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Сортировка" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Сначала новые</SelectItem>
            <SelectItem value="asc">Сначала старые</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-col gap-2">
          <Select value={selectedCustomFilter} onValueChange={value => value === 'none' ? setSelectedCustomFilter('') : applyCustomFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Мои фильтры" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без фильтра</SelectItem>
              {customFilters.map(f => (
                <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={saveCustomFilter}>Сохранить фильтр</Button>
            {selectedCustomFilter && (
              <Button type="button" size="sm" variant="destructive" onClick={() => deleteCustomFilter(selectedCustomFilter)}>Удалить</Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {tickets.length === 0 ? 'Заявки не найдены' : 'Нет заявок, соответствующих фильтрам'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${user?.role === 'agent' && ticket.agent_id === user.id ? 'border-2 border-blue-500' : ''}`}
              onClick={() => onSelectTicket(ticket.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">
                      #{ticket.id} {ticket.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {ticket.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-4">
                    <span>Создана: {formatDate(ticket.created_at)}</span>
                    {ticket.agent && (
                      <span className={`font-bold px-2 py-1 rounded ${user?.role === 'agent' && ticket.agent_id === user.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        Исполнитель: {ticket.agent.username}
                      </span>
                    )}
                  </div>
                  <span>Заказчик: {ticket.customer.username}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketList;

