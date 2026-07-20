import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import PlanPage from '@/pages/PlanPage';
import CalendarPage from '@/pages/CalendarPage';
import CoursePage from '@/pages/CoursePage';
import SettingsPage from '@/pages/SettingsPage';
import ReportPage from '@/pages/ReportPage';
import TimelinePage from '@/pages/TimelinePage';
import PaperPage from '@/pages/PaperPage';
import ExperimentsPage from '@/pages/ExperimentsPage';
import TagsPage from '@/pages/TagsPage';
import StatsPage from '@/pages/StatsPage';
import CountdownPage from '@/pages/CountdownPage';
import LifeEventsPage from '@/pages/LifeEventsPage';
import TravelMapPage from '@/pages/TravelMapPage';
import WishlistPage from '@/pages/WishlistPage';
import CityDetailPage from '@/pages/CityDetailPage';
import PackingPage from '@/pages/PackingPage';
import PackingDetailPage from '@/pages/PackingDetailPage';
import TemplatesPage from '@/pages/TemplatesPage';
import AssetsPage from '@/pages/AssetsPage';
import AssetDetailPage from '@/pages/AssetDetailPage';
import FinancePage from '@/pages/FinancePage';
import FinanceAccountsPage from '@/pages/FinanceAccountsPage';
import FinanceStatsPage from '@/pages/FinanceStatsPage';
import MemoriesPage from '@/pages/MemoriesPage';
import BadgesPage from '@/pages/BadgesPage';
import AdvisorPage from '@/pages/AdvisorPage';
import ContactsPage from '@/pages/ContactsPage';
import GradPage from '@/pages/GradPage';
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'plan/:date', element: <PlanPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'courses', element: <CoursePage /> },
      { path: 'report', element: <ReportPage /> },
      { path: 'countdown', element: <CountdownPage /> },
      { path: 'life-events', element: <LifeEventsPage /> },
      { path: 'travel', element: <TravelMapPage /> },
      { path: 'travel/:cityId', element: <CityDetailPage /> },
      { path: 'wishlist', element: <WishlistPage /> },
      { path: 'packing', element: <PackingPage /> },
      { path: 'packing/:listId', element: <PackingDetailPage /> },
      { path: 'packing/templates', element: <TemplatesPage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'assets/:id', element: <AssetDetailPage /> },
      { path: 'finance',          element: <FinancePage /> },
      { path: 'finance/accounts', element: <FinanceAccountsPage /> },
      { path: 'finance/stats',    element: <FinanceStatsPage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'timeline', element: <TimelinePage /> },
      { path: 'papers', element: <PaperPage /> },
      { path: 'experiments', element: <ExperimentsPage /> },
      { path: 'tags', element: <TagsPage /> },
      { path: 'memories', element: <MemoriesPage /> },
      { path: 'badges', element: <BadgesPage /> },
      { path: 'advisor', element: <AdvisorPage /> },
      { path: 'contacts', element: <ContactsPage /> },
      { path: 'grad', element: <GradPage /> },
    ],
  },
]);
