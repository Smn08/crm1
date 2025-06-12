import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/ui/card';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Alert, AlertDescription } from '@/ui/alert';
import { Plus, Trash2, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const CompanyManagement = () => {
  const { API_BASE_URL } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '' });

  useEffect(() => { fetchCompanies(); }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/companies/`, { credentials: 'include' });
      if (res.ok) setCompanies(await res.json());
      else setError('Ошибка загрузки компаний');
    } catch {
      setError('Ошибка сети');
    }
    setLoading(false);
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/companies/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newCompany),
      });
      if (res.ok) {
        setSuccess('Компания добавлена');
        setNewCompany({ name: '' });
        setIsCreateDialogOpen(false);
        fetchCompanies();
      } else {
        const err = await res.json();
        setError(err.error || 'Ошибка создания компании');
      }
    } catch {
      setError('Ошибка сети');
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Удалить компанию?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/companies/${id}`, {
        method: 'DELETE', credentials: 'include'
      });
      if (res.ok) fetchCompanies();
      else setError('Ошибка удаления');
    } catch {
      setError('Ошибка сети');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" /> Компании
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Добавление и удаление компаний для заказчиков</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2"><Plus className="h-4 w-4" />Добавить компанию</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Добавить компанию</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateCompany} className="space-y-4">
              <Input value={newCompany.name} onChange={e => setNewCompany({ name: e.target.value })} placeholder="Название компании" required />
              <Button type="submit" className="w-full">Добавить</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}
      <Card>
        <CardHeader>
          <CardTitle>Список компаний</CardTitle>
          <CardDescription>Всего компаний: {companies.length}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.id}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteCompany(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyManagement;
