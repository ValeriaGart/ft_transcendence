import { myJSX } from './util/mini-jsx';
import { AppOne } from './pageOne/AppOne';
import { LoadingPage } from './pageOne/LoadingPage';

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
    <div id="app-container" class="relative w-full h-full">
      <AppOne onEnterClick={handleEnterClick} />
    </div>
  );
}
