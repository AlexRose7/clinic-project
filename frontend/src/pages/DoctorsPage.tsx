import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Doctor } from '../types';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/doctors')
      .then((res) => setDoctors(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Загрузка...</p>;

  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto', padding: '2rem' }}>
      <h1>Наши врачи</h1>
      {doctors.length === 0 && <p>Врачи пока не добавлены</p>}
      {doctors.map((d) => (
        <div key={d.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 12 }}>
          <strong>{d.lastName} {d.firstName}</strong>
          <p>{d.specialization} — Опыт: {d.experienceYears} лет</p>
        </div>
      ))}
    </main>
  );
}
