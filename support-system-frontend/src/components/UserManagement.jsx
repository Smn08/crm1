import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import { Alert, AlertDescription } from '@/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { Badge } from '@/ui/badge';
import { Users, UserPlus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [companies, setCompanies] = useState([]);
  
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'customer'
  });

  const { API_BASE_URL } = useAuth();

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        setError('Ошибка загрузки пользователей');
      }
    } catch (error) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/companies/`, { credentials: 'include' });
      if (res.ok) setCompanies(await res.json());
    } catch {}
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setSuccess('Пользователь успешно создан');
        setNewUser({ username: '', email: '', password: '', role: 'customer' });
        setIsCreateDialogOpen(false);
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка создания пользователя');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editingUser),
      });

      if (response.ok) {
        setSuccess('Пользователь успешно обновлен');
        setIsEditDialogOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка обновления пользователя');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('Пользователь успешно удален');
        fetchUsers();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка удаления пользователя');
      }
    } catch (error) {
      setError('Ошибка сети');
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { label: 'Администратор', variant: 'destructive' },
      agent: { label: 'Исполнитель', variant: 'default' },
      customer: { label: 'Заказчик', variant: 'secondary' }
    };
    
    const config = roleConfig[role] || { label: role, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Загрузка пользователей...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Управление пользователями
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Создание, редактирование и удаление пользователей системы
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Создать пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать нового пользователя</DialogTitle>
              <DialogDescription>
                Заполните форму для создания нового пользователя
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-username">Имя пользователя</Label>
                <Input
                  id="new-username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">Пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-role">Роль</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Заказчик</SelectItem>
                    <SelectItem value="agent">Исполнитель</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newUser.role === 'customer' && (
                <div className="space-y-2">
                  <Label htmlFor="new-company">Компания</Label>
                  <Select value={newUser.company_id || ''} onValueChange={v => setNewUser({...newUser, company_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Выберите компанию" /></SelectTrigger>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button type="submit" className="w-full">
                Создать пользователя
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Список пользователей</CardTitle>
          <CardDescription>
            Всего пользователей: {users.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Имя пользователя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Дата создания</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Н/Д'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser({...user});
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              Измените данные пользователя
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Имя пользователя</Label>
                <Input
                  id="edit-username"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-password">Новый пароль (оставьте пустым, чтобы не менять)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editingUser.password || ''}
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-role">Роль</Label>
                <Select 
                  value={editingUser.role} 
                  onValueChange={(value) => setEditingUser({...editingUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Заказчик</SelectItem>
                    <SelectItem value="agent">Исполнитель</SelectItem>
                    <SelectItem value="admin">Администратор</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingUser.role === 'customer' && (
                <div className="space-y-2">
                  <Label htmlFor="edit-company">Компания</Label>
                  <Select value={editingUser.company_id || ''} onValueChange={v => setEditingUser({...editingUser, company_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Выберите компанию" /></SelectTrigger>
                    <SelectContent>
                      {companies.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <Button type="submit" className="w-full">
                Обновить пользователя
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

