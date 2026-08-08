import React from 'react';
import './App.css';
import { VaultProvider, useVault } from './context/VaultContext';
import { UnlockPage, Dashboard } from './components';

const VaultApp = () => {
  const { isUnlocked } = useVault();

  return isUnlocked ? <Dashboard /> : <UnlockPage />;
};

function App() {
  return (
    <VaultProvider>
      <VaultApp />
    </VaultProvider>
  );
}

export default App;
