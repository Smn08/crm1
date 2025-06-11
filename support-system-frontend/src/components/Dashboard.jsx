import React, { useState } from 'react';
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
  Bell
} from 'lucide-react';
import TicketList from './TicketList';
import CreateTicket from './CreateTicket';
import TicketDetail from './TicketDetail';
import UserManagement from './UserManagement';
import KnowledgeBase from './KnowledgeBase';

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
    }

    return baseItems;
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardHome user={user} />;
      case 'tickets':
        return <TicketList onTicketSelect={handleTicketSelect} />;
      case 'create-ticket':
        return <CreateTicket onTicketCreated={() => setActiveView('tickets')} />;
      case 'ticket-detail':
        return <TicketDetail ticketId={selectedTicketId} onBack={handleBackToList} />;
      case 'users':
        return <UserManagement />;
      case 'knowledge':
        return <KnowledgeBase />;
      default:
        return <DashboardHome user={user} />;
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

const DashboardHome = ({ user }) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Добро пожаловать, {user?.username}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Система технической поддержки
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Роль в системе
            </CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.role === 'admin' ? 'Администратор' : 
               user?.role === 'agent' ? 'Исполнитель' : 'Заказчик'}
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.role === 'admin' ? 'Полный доступ к системе' : 
               user?.role === 'agent' ? 'Обработка заявок' : 'Создание заявок'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Быстрые действия
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user?.role === 'customer' && (
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Создать заявку
                </Button>
              )}
              <Button variant="outline" size="sm" className="w-full">
                <BookOpen className="h-4 w-4 mr-2" />
                База знаний
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Статус системы
            </CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Онлайн
            </div>
            <p className="text-xs text-muted-foreground">
              Все системы работают нормально
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Добро пожаловать в систему поддержки</CardTitle>
          <CardDescription>
            Здесь вы можете управлять заявками, просматривать базу знаний и получать помощь
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Возможности системы:</h3>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Создание и отслеживание заявок</li>
                <li>• Система сообщений для общения с поддержкой</li>
                <li>• База знаний с инструкциями и FAQ</li>
                <li>• Автоматическое обновление статусов заявок</li>
                {user?.role === 'admin' && <li>• Управление пользователями и системой</li>}
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Нужна помощь?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Посетите раздел "База знаний" для получения инструкций и ответов на часто задаваемые вопросы.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

