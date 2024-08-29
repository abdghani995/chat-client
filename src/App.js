import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Chat from './components/Chat';
import Home from './components/Home';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat/:groupid" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
