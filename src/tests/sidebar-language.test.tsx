import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '../renderer/components/layout/Sidebar';
import { useLanguageStore } from '../renderer/stores/useLanguageStore';
import { useAuthStore } from '../renderer/stores/useAuthStore';

describe('Sidebar Language Switching', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('zabad_sidebar_collapsed', 'false');
    useAuthStore.getState().setRoleMode('manager');
  });

  it('renders English + Arabic labels when language is set to en', () => {
    useLanguageStore.getState().setLanguage('en');

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Overview - نظرة عامة')).toBeInTheDocument();
    expect(screen.getByText('Sales (POS) - نقطة البيع')).toBeInTheDocument();
    expect(screen.getByText('POS Register - الصندوق')).toBeInTheDocument();
    expect(screen.getByText('Direct Purchase - شراء مباشر')).toBeInTheDocument();
    expect(screen.getByText('1. Suppliers - الموردين')).toBeInTheDocument();
    expect(screen.getByText('Settings - الإعدادات')).toBeInTheDocument();
    expect(screen.getByText('Lock to Cashier - قفل إلى الكاشير')).toBeInTheDocument();
  });

  it('renders French + Arabic labels when language is set to fr', () => {
    useLanguageStore.getState().setLanguage('fr');

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('Aperçu - نظرة عامة')).toBeInTheDocument();
    expect(screen.getByText('Vente (POS) - نقطة البيع')).toBeInTheDocument();
    expect(screen.getByText('Caisse POS - الصندوق')).toBeInTheDocument();
    expect(screen.getByText('Achat Direct - شراء مباشر')).toBeInTheDocument();
    expect(screen.getByText('1. Fournisseurs - الموردين')).toBeInTheDocument();
    expect(screen.getByText('Paramètres - الإعدادات')).toBeInTheDocument();
    expect(screen.getByText('Verrouiller en Caisse - قفل إلى الكاشير')).toBeInTheDocument();
  });

  it('renders Arabic labels when language is set to ar', () => {
    useLanguageStore.getState().setLanguage('ar');

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText('نظرة عامة')).toBeInTheDocument();
    expect(screen.getByText('نقطة البيع')).toBeInTheDocument();
    expect(screen.getByText('الإعدادات')).toBeInTheDocument();
    expect(screen.getByText('قفل إلى الكاشير')).toBeInTheDocument();
  });
});
