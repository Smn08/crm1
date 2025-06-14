import React, { useState, useEffect } from 'react';
import { Button, Input, Table } from '../ui';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompanyName, setNewCompanyName] = useState('');

  useEffect(() => {
    fetch('/companies')
      .then((response) => response.json())
      .then((data) => setCompanies(data));
  }, []);

  const handleAddCompany = () => {
    fetch('/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newCompanyName }),
    })
      .then((response) => response.json())
      .then((company) => {
        setCompanies((prev) => [...prev, company]);
        setNewCompanyName('');
      });
  };

  return (
    <div>
      <h1>Manage Companies</h1>
      <div>
        <Input
          value={newCompanyName}
          onChange={(e) => setNewCompanyName(e.target.value)}
          placeholder="Enter company name"
        />
        <Button onClick={handleAddCompany}>Add Company</Button>
      </div>
      <Table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr key={company.id}>
              <td>{company.id}</td>
              <td>{company.name}</td>
              <td>{new Date(company.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default CompanyManagement;
