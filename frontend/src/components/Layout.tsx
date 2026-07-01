import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Header />
      <main className={`w-full min-h-screen pb-20 lg:pb-0`}>
        <Outlet />
      </main>
    </div>
  );
}
