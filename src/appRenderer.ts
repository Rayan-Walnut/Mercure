(() => {
  type SessionUser = {
    nom?: string;
    prenom?: string;
    email?: string;
  };

  const STORAGE_KEYS = {
    cookie: 'mercure.session.cookie',
    user: 'mercure.session.user',
    legacyCookies: ['cookie', 'session_cookie', 'astracode.cookie'],
  } as const;

  const refs = {
    profileTrigger: requiredElement<HTMLButtonElement>('#profile-trigger'),
    profileMenu: requiredElement<HTMLDivElement>('#profile-menu'),
    profileAvatar: requiredElement<HTMLSpanElement>('#profile-avatar'),
    profileName: requiredElement<HTMLParagraphElement>('#profile-name'),
    profileEmail: requiredElement<HTMLParagraphElement>('#profile-email'),
    chatUserBadge: requiredElement<HTMLParagraphElement>('#chat-user-badge'),
    menuProfile: requiredElement<HTMLButtonElement>('#menu-profile'),
    menuSettings: requiredElement<HTMLButtonElement>('#menu-settings'),
    menuLogout: requiredElement<HTMLButtonElement>('#menu-logout'),
  };

  applyPlatformClass();

  const session = getSession();
  if (!session) {
    window.location.replace('./login.html');
  } else {
    renderUser(session.user ?? { email: 'utilisateur@mercure.app' });
    bindProfileMenu();
  }

  function bindProfileMenu(): void {
    refs.profileTrigger.addEventListener('click', (event) => {
      event.stopPropagation();
      refs.profileMenu.classList.toggle('hidden');
    });

    refs.profileMenu.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    refs.menuProfile.addEventListener('click', closeProfileMenu);
    refs.menuSettings.addEventListener('click', closeProfileMenu);
    refs.menuLogout.addEventListener('click', () => {
      clearSession();
      window.location.replace('./login.html');
    });

    document.addEventListener('click', closeProfileMenu);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeProfileMenu();
      }
    });
  }

  function closeProfileMenu(): void {
    refs.profileMenu.classList.add('hidden');
  }

  function renderUser(user: SessionUser): void {
    const email = user.email ?? 'utilisateur@mercure.app';
    const fullName = [user.prenom, user.nom].filter(Boolean).join(' ').trim();
    const displayName = fullName || user.prenom || user.nom || 'Utilisateur';

    refs.profileAvatar.textContent = getInitials(displayName, email);
    refs.profileName.textContent = displayName;
    refs.profileEmail.textContent = email;
    refs.chatUserBadge.textContent = `Connecte: ${displayName}`;
  }

  function getSession(): { cookie: string; user: SessionUser | null } | null {
    const cookie = getStoredCookie();
    if (!cookie) {
      return null;
    }

    return {
      cookie,
      user: getStoredUser(),
    };
  }

  function getStoredCookie(): string | null {
    const mainCookie = localStorage.getItem(STORAGE_KEYS.cookie);
    if (mainCookie) {
      return mainCookie;
    }

    for (const key of STORAGE_KEYS.legacyCookies) {
      const legacyCookie = localStorage.getItem(key);
      if (legacyCookie) {
        localStorage.setItem(STORAGE_KEYS.cookie, legacyCookie);
        return legacyCookie;
      }
    }

    return null;
  }

  function getStoredUser(): SessionUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }

  function clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.cookie);
    localStorage.removeItem(STORAGE_KEYS.user);
    for (const key of STORAGE_KEYS.legacyCookies) {
      localStorage.removeItem(key);
    }
  }

  function getInitials(name: string, email: string): string {
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return email.slice(0, 2).toUpperCase();
  }

  function applyPlatformClass(): void {
    const runtimeWindow = window as Window & { electronAPI?: { platform?: string } };
    if (runtimeWindow.electronAPI?.platform === 'win32') {
      document.body.classList.add('is-win32');
    }
  }

  function requiredElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
      throw new Error(`Element missing in HTML: ${selector}`);
    }

    return element;
  }
})();
