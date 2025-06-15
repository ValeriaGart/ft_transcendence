import { myJSX } from './util/mini-jsx';
import { AppOne } from './legacy/AppOne';
import { LoadingPage } from './legacy/LoadingPage';

export function App() {
  const handleEnterClick = () => {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.innerHTML = '';
      const loadingPageElement = myJSX(LoadingPage, {});
      appContainer.appendChild(loadingPageElement);
    }
  };

  return (
    <div id="app-container">
      <AppOne onEnterClick={handleEnterClick} />
    </div>
  );
}
