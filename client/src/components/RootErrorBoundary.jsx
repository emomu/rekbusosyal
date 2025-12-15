import { useRouteError, useNavigate } from 'react-router-dom';
import ErrorPage from '../pages/ErrorPage';
import NotFoundPage from '../pages/NotFoundPage';

/**
 * Root Error Boundary - Catches all routing errors and displays appropriate page
 */
export default function RootErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  // Handle 404 errors
  if (error?.status === 404 || error?.message?.includes('bulunamadı')) {
    return <NotFoundPage />;
  }

  // Handle all other errors with ErrorPage
  return <ErrorPage />;
}
