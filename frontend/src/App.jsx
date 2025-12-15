// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Register from './pages/Register';
import Login from './pages/Login';

// Importar todas las páginas
import Home from './pages/Home';
import Missions from './pages/Missions';
import Food from './pages/Food';
import Gym from './pages/Gym';
import Shop from './pages/Shop';
import Profile from './pages/Profile';
import Games from './pages/Games';
import FortuneWheel from './pages/games/FortuneWheel';
import ScratchGame from './pages/games/ScratchGame';
import DiceGame from './pages/games/DiceGame';
import Roulette from './pages/games/Roulette';


function App() {
    return (
        <Router>
            <Routes>
                {/* Rutas Públicas */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Rutas Privadas (Con Header y Footer) */}
                <Route element={<Layout />}>
                    <Route path="/home" element={<Home />} />
                    <Route path="/missions" element={<Missions />} />
                    <Route path="/food" element={<Food />} />
                    <Route path="/gym" element={<Gym />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/games" element={<Games />} />
                    <Route path="/games/fortune-wheel" element={<FortuneWheel />} />
                    <Route path="/games/scratch" element={<ScratchGame />} />
                    <Route path="/games/dice" element={<DiceGame />} />
                    <Route path="/games/roulette" element={<Roulette />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;