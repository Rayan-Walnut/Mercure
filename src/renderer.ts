type LoginResponse = {
  message?: string;
  cookie?: string;
  role?: number;
  detail?: string;
  user_info?: {
    nom?: string;
    prenom?: string;
    email?: string;
  };
};

const API_BASE_URL = 'https://api.astracode.dev';
const SESSION_COOKIE_KEY = 'mercure.session.cookie';
const SESSION_USER_KEY = 'mercure.session.user';
const SAVED_EMAIL_KEY = 'mercure.login.email';

const loginForm = must(document.querySelector<HTMLFormElement>('#login-form'), '#login-form');
const emailInput = must(document.querySelector<HTMLInputElement>('#email'), '#email');
const passwordInput = must(document.querySelector<HTMLInputElement>('#password'), '#password');
const rememberEmailInput = must(
  document.querySelector<HTMLInputElement>('#remember-email'),
  '#remember-email'
);
const submitButton = must(document.querySelector<HTMLButtonElement>('#submit-button'), '#submit-button');
const submitLabel = must(document.querySelector<HTMLSpanElement>('.button-label'), '.button-label');
const statusElement = must(document.querySelector<HTMLParagraphElement>('#form-status'), '#form-status');

const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
if (savedEmail) {
  emailInput.value = savedEmail;
  rememberEmailInput.checked = true;
}

const existingCookie = localStorage.getItem(SESSION_COOKIE_KEY);
if (existingCookie) {
  setStatus('Session detectee localement. Tu peux te reconnecter pour la rafraichir.', 'neutral');
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

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
    const response = await fetch(`${API_BASE_URL}/accounts/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = (await parseJsonSafe(response)) as LoginResponse;

    if (!response.ok) {
      throw new Error(extractErrorMessage(data, response.status));
    }

    if (!data.cookie) {
      throw new Error('La reponse ne contient pas de cookie de session.');
    }

    localStorage.setItem(SESSION_COOKIE_KEY, data.cookie);
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user_info ?? { email }));

    if (rememberEmailInput.checked) {
      localStorage.setItem(SAVED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }

    const displayName = data.user_info?.prenom || data.user_info?.email || email;
    setStatus(`Connexion reussie. Bienvenue ${displayName}.`, 'success');
    passwordInput.value = '';
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connexion impossible.';
    setStatus(message, 'error');
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading: boolean): void {
  submitButton.disabled = isLoading;
  emailInput.disabled = isLoading;
  passwordInput.disabled = isLoading;
  rememberEmailInput.disabled = isLoading;
  submitLabel.textContent = isLoading ? 'Connexion...' : 'Se connecter';
}

function setStatus(message: string, type: 'success' | 'error' | 'neutral'): void {
  statusElement.textContent = message;
  statusElement.classList.remove('text-red-300', 'text-emerald-300', 'text-stone-300');

  if (type === 'success') {
    statusElement.classList.add('text-emerald-300');
    return;
  }

  if (type === 'error') {
    statusElement.classList.add('text-red-300');
    return;
  }

  statusElement.classList.add('text-stone-300');
}

function isEmailFormatValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return {};
  }

  return response.json();
}

function must<T>(value: T | null, selector: string): T {
  if (!value) {
    throw new Error(`Element missing in index.html: ${selector}`);
  }

  return value;
}

function extractErrorMessage(data: unknown, status: number): string {
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
