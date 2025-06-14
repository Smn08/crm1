import React from 'react';
import { BookOpen, Ticket, Users, MessageSquare } from 'lucide-react';

const MainHero = () => (
  <section className="relative overflow-hidden rounded-2xl shadow-lg bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800 p-6 flex flex-col md:flex-row items-center gap-6 mb-8 border border-blue-200 dark:border-gray-800">
    <div className="flex-1 flex flex-col gap-4">
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-1">
        Добро пожаловать в <span className="text-blue-600 dark:text-blue-400">CRM поддержку</span>
      </h1>
      <p className="text-base text-gray-700 dark:text-gray-300 max-w-2xl">
        Единая платформа для управления заявками, общения с поддержкой и поиска ответов в базе знаний. Всё для эффективной работы вашей команды и быстрого решения проблем.
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-lg px-3 py-1.5 shadow text-sm">
          <Ticket className="w-5 h-5 text-blue-500" />
          <span className="font-medium">Заявки</span>
        </div>
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-lg px-3 py-1.5 shadow text-sm">
          <MessageSquare className="w-5 h-5 text-green-500" />
          <span className="font-medium">Чат с поддержкой</span>
        </div>
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-lg px-3 py-1.5 shadow text-sm">
          <BookOpen className="w-5 h-5 text-indigo-500" />
          <span className="font-medium">База знаний</span>
        </div>
        <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 rounded-lg px-3 py-1.5 shadow text-sm">
          <Users className="w-5 h-5 text-pink-500" />
          <span className="font-medium">Команда</span>
        </div>
      </div>
    </div>
    <div className="flex-1 flex justify-center items-center">
      <img src="/crm-hero-illustration.svg" alt="CRM Support" className="max-w-[180px] md:max-w-xs drop-shadow-xl rounded-xl" />
    </div>
  </section>
);

export default MainHero;
