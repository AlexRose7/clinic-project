export default function HomePage() {
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>Медицинская поликлиника</h1>
      <p>Добро пожаловать! Запись к врачу онлайн.</p>
      <nav>
        <a href="/doctors" style={{ marginRight: 16 }}>Врачи</a>
        <a href="/appointments" style={{ marginRight: 16 }}>Мои записи</a>
        <a href="/login">Войти</a>
      </nav>
    </main>
  );
}
