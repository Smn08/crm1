import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  BookOpen, 
  LogOut, 
  Plus,
  Settings,
  Bell,
  AlertCircle,
  Clock,
  User,
  Building2
} from 'lucide-react';
import TicketList from './TicketList';
import CreateTicket from './CreateTicket';
import TicketDetail from './TicketDetail';
import UserManagement from './UserManagement';
import KnowledgeBase from './KnowledgeBase';
import CompanyManagement from './CompanyManagement';

const Dashboard = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const handleTicketSelect = (ticketId) => {
    setSelectedTicketId(ticketId);
    setActiveView('ticket-detail');
  };

  const handleBackToList = () => {
    setSelectedTicketId(null);
    setActiveView('tickets');
  };

  const getNavItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Главная', icon: LayoutDashboard },
      { id: 'tickets', label: 'Заявки', icon: Ticket },
      { id: 'knowledge', label: 'База знаний', icon: BookOpen },
    ];

    if (user?.role === 'customer') {
      baseItems.splice(2, 0, { id: 'create-ticket', label: 'Создать заявку', icon: Plus });
    }

    if (user?.role === 'admin') {
      baseItems.push({ id: 'users', label: 'Пользователи', icon: Users });
      baseItems.push({ id: 'companies', label: 'Компании', icon: Building2 });
    }

    return baseItems;
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome user={user} setActiveView={setActiveView} />;
      case 'tickets':
        return <TicketList onSelectTicket={handleTicketSelect} />;
      case 'create-ticket':
        return <CreateTicket onTicketCreated={() => setActiveView('tickets')} />;
      case 'ticket-detail':
        return <TicketDetail ticketId={selectedTicketId} onBack={handleBackToList} />;
      case 'users':
        return <UserManagement />;
      case 'knowledge':
        return <KnowledgeBase />;
      case 'companies':
        return <CompanyManagement />;
      default:
        return <DashboardHome user={user} setActiveView={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Система поддержки
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.username}
                </span>
                <Badge variant={
                  user?.role === 'admin' ? 'destructive' : 
                  user?.role === 'agent' ? 'default' : 'secondary'
                }>
                  {user?.role === 'admin' ? 'Администратор' : 
                   user?.role === 'agent' ? 'Исполнитель' : 'Заказчик'}
                </Badge>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {getNavItems().map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

const DashboardHome = ({ user, setActiveView }) => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const fetchStats = async () => {
      let url = 'http://localhost:5002/api/tickets/stats';
      if (user?.role === 'agent') url += '?agent=me';
      if (user?.role === 'customer') url += '?customer=me';
      try {
        const res = await fetch(url, { credentials: 'include' });
        if (res.ok) setStats(await res.json());
        else setStats({ error: 'Ошибка загрузки статистики' });
      } catch {
        setStats({ error: 'Ошибка загрузки статистики' });
      }
    };
    fetchStats();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Приветственный блок */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900">
        <CardContent className="flex items-center gap-6 py-6">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-blue-200 dark:bg-gray-700 flex items-center justify-center shadow-md">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-200" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Здравствуйте, {user?.username}!</h2>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={
                user?.role === 'admin' ? 'destructive' : 
                user?.role === 'agent' ? 'default' : 'secondary'
              }>
                {user?.role === 'admin' ? 'Администратор' : 
                 user?.role === 'agent' ? 'Исполнитель' : 'Заказчик'}
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Добро пожаловать в систему поддержки! Здесь вы можете управлять заявками, просматривать базу знаний и получать помощь.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-3">
        {/* Активные заявки */}
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ticket className="h-5 w-5 text-blue-500" /> Активные заявки
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!stats ? (
              <span className="text-gray-500">Загрузка...</span>
            ) : stats.error ? (
              <span className="text-red-500">{stats.error}</span>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <span className="font-medium">Ожидает ответа заказчика:</span>
                  <span className="bg-orange-100 text-orange-800 rounded px-2 py-0.5 font-bold">{stats.awaiting_customer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">В работе:</span>
                  <span className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 font-bold">{stats.in_progress ?? 0}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Ожидает ответа поддержки:</span>
                  <span className="bg-green-100 text-green-800 rounded px-2 py-0.5 font-bold">{stats.awaiting_agent ?? 0}</span>
                </div>
                {stats.awaiting_customer === 0 && stats.in_progress === 0 && stats.awaiting_agent === 0 && (
                  <span className="text-gray-500">Нет активных заявок</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Быстрые действия */}
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-500" /> Быстрые действия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveView('tickets')}>
                <Ticket className="h-4 w-4 mr-2" /> Все заявки
              </Button>
              {user?.role === 'customer' && (
                <Button size="sm" className="w-full" onClick={() => setActiveView('create-ticket')}>
                  <Plus className="h-4 w-4 mr-2" /> Создать заявку
                </Button>
              )}
              <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveView('knowledge')}>
                <BookOpen className="h-4 w-4 mr-2" /> База знаний
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Статус системы */}
        <Card className="shadow-md border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-green-500" /> Статус системы
            </CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Онлайн</div>
            <p className="text-xs text-muted-foreground">Все системы работают нормально</p>
          </CardContent>
        </Card>
      </div>

      {/* Возможности и помощь */}
      <Card className="shadow-md border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" /> Возможности системы
          </CardTitle>
          <CardDescription>
            Кратко о том, что вы можете делать в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2"><Ticket className="w-4 h-4 text-blue-400" />Создание и отслеживание заявок</li>
              <li className="flex items-center gap-2"><Bell className="w-4 h-4 text-green-400" />Система сообщений для общения с поддержкой</li>
              <li className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-purple-400" />База знаний с инструкциями и FAQ</li>
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-yellow-400" />Автоматическое обновление статусов заявок</li>
              {user?.role === 'admin' && <li className="flex items-center gap-2"><Users className="w-4 h-4 text-red-400" />Управление пользователями и системой</li>}
            </ul>
            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-orange-400" />Нужна помощь?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Посетите раздел <b>База знаний</b> для получения инструкций и ответов на часто задаваемые вопросы.</p>
              <Button variant="secondary" size="sm" onClick={() => setActiveView('knowledge')}>
                <BookOpen className="h-4 w-4 mr-2" /> Перейти в базу знаний
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

