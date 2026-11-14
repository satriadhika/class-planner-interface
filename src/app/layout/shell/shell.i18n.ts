import { Dictionary } from '../../core/i18n/i18n';

export interface ShellText {
  toggleMenu: string;
  home: string;
  announcements: string;
  guide: string;
  changePassword: string;
  logout: string;
  mainMenu: string;
  menuOf: string;
  status: { done: string; current: string; locked: string; missed: string };
}

export const SHELL_TEXT: Dictionary<ShellText> = {
  id: {
    toggleMenu: 'Buka/tutup menu',
    home: 'beranda',
    announcements: 'Pengumuman',
    guide: 'Panduan aplikasi',
    changePassword: 'Ganti password',
    logout: 'Keluar',
    mainMenu: 'Menu utama',
    menuOf: 'Menu {role}',
    status: { done: '(selesai)', current: '(sedang berjalan)', locked: '(belum dibuka)', missed: '(terlewat)' },
  },
  en: {
    toggleMenu: 'Open/close menu',
    home: 'home',
    announcements: 'Announcements',
    guide: 'User guide',
    changePassword: 'Change password',
    logout: 'Sign out',
    mainMenu: 'Main menu',
    menuOf: '{role} menu',
    status: { done: '(done)', current: '(in progress)', locked: '(not open yet)', missed: '(missed)' },
  },
};
