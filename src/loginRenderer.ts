(() => {
  type SessionUser = {
    nom?: string;
    prenom?: string;
    email?: string;
  };

  type LoginApiResponse = {
    message?: string;
    detail?: string;
    cookie?: string;
    user_info?: SessionUser;
  };

  const API_BASE_URL = 'https://api.astracode.dev';
  const STORAGE_KEYS = {
    cookie: 'mercure.session.cookie',
    user: 'mercure.session.user',
    rememberedEmail: 'mercure.login.email',
    legacyCookies: ['cookie', 'session_cookie', 'astracode.cookie'],
  } as const;

  const refs = {
    form: requiredElement<HTMLFormElement>('#login-form'),
    emailInput: requiredElement<HTMLInputElement>('#email'),
    passwordInput: requiredElement<HTMLInputElement>('#password'),
    rememberEmailInput: requiredElement<HTMLInputElement>('#remember-email'),
    submitButton: requiredElement<HTMLButtonElement>('#submit-button'),
    submitLabel: requiredElement<HTMLSpanElement>('.button-label'),
    status: requiredElement<HTMLParagraphElement>('#form-status'),
  };

  applyPlatformClass();
  hydrateRememberedEmail();
  redirectIfSessionExists();

  refs.form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = refs.emailInput.value.trim();
    const password = refs.passwordInput.value;

    if (!email || !password) {
      setStatus('Renseigne ton email et ton mot de passe.', 'error');
      return;
    }

    if (!isEmailFormatValid(email)) {
      setStatus('Format email invalide.', 'error');
      return;
    }

    setLoading(true);
    setStatus('Connexion en cours...', 'neutral');

    try {
      const data = await login(email, password);
      if (!data.cookie) {
        throw new Error('La reponse ne contient pas de cookie de session.');
      }

      const user = data.user_info ?? { email };
      saveSession(data.cookie, user);

      if (refs.rememberEmailInput.checked) {
        localStorage.setItem(STORAGE_KEYS.rememberedEmail, email);
      } else {
        localStorage.removeItem(STORAGE_KEYS.rememberedEmail);
      }

      window.location.replace('./app.html');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connexion impossible.';
      setStatus(message, 'error');
    } finally {
      setLoading(false);
    }
  });

  async function login(email: string, password: string): Promise<LoginApiResponse> {
    const response = await fetch(`${API_BASE_URL}/accounts/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await parseJsonSafe(response)) as LoginApiResponse;
    if (!response.ok) {
      throw new Error(getApiErrorMessage(data, response.status));
    }

    return data;
  }

  function hydrateRememberedEmail(): void {
    const rememberedEmail = localStorage.getItem(STORAGE_KEYS.rememberedEmail);
    if (!rememberedEmail) {
      return;
    }

    refs.emailInput.value = rememberedEmail;
    refs.rememberEmailInput.checked = true;
  }

  function redirectIfSessionExists(): void {
    const cookie = getStoredCookie();
    if (!cookie) {
      return;
    }

    window.location.replace('./app.html');
  }

  function saveSession(cookie: string, user: SessionUser): void {
    localStorage.setItem(STORAGE_KEYS.cookie, cookie);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
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

  function setLoading(isLoading: boolean): void {
    refs.submitButton.disabled = isLoading;
    refs.emailInput.disabled = isLoading;
    refs.passwordInput.disabled = isLoading;
    refs.rememberEmailInput.disabled = isLoading;
    refs.submitLabel.textContent = isLoading ? 'Connexion...' : 'Se connecter';
  }

  function setStatus(message: string, tone: 'neutral' | 'success' | 'error'): void {
    refs.status.textContent = message;
    refs.status.classList.remove('text-zinc-300', 'text-emerald-300', 'text-red-300');

    if (tone === 'success') {
      refs.status.classList.add('text-emerald-300');
      return;
    }

    if (tone === 'error') {
      refs.status.classList.add('text-red-300');
      return;
    }

    refs.status.classList.add('text-zinc-300');
  }

  function applyPlatformClass(): void {
    const runtimeWindow = window as Window & { electronAPI?: { platform?: string } };
    if (runtimeWindow.electronAPI?.platform === 'win32') {
      document.body.classList.add('is-win32');
    }
  }

  function isEmailFormatValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function getApiErrorMessage(data: unknown, status: number): string {
    if (data && typeof data === 'object') {
      const message = Reflect.get(data, 'message');
      if (typeof message === 'string' && message.trim()) {
        return message;
      }

      const detail = Reflect.get(data, 'detail');
      if (typeof detail === 'string' && detail.trim()) {
        return detail;
      }
    }

    return `Erreur HTTP ${status}`;
  }

  async function parseJsonSafe(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      return {};
    }

    return response.json();
  }

  function requiredElement<T extends Element>(selector: string): T {
    const element = document.querySelector<T>(selector);
    if (!element) {
      throw new Error(`Element missing in HTML: ${selector}`);
    }

    return element;
  }
})();
