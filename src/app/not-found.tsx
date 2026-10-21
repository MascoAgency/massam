import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card empty">
      <h2>Sayfa bulunamadı</h2>
      <p>Aradığınız sayfa taşınmış ya da kaldırılmış olabilir.</p>
      <Link className="btn" href="/panel">Panele dön</Link>
    </div>
  );
}
