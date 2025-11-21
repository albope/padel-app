// src/hooks/useResultForm.js
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from '../firebase';
import dayjs from 'dayjs';

export const PLAYERS_LIST = ["Lucas", "Ricardo", "Martin", "Bort", "Invitado"];
export const LOCATIONS_LIST = ["Passing Padel", "Elite Padel 22", "Flow Padel", "Aspresso k7", "Otro"];

export const useResultForm = () => {
  const navigate = useNavigate();
  
  // Estados
  const [pair1, setPair1] = useState({ player1: '', player2: '' });
  const [pair2, setPair2] = useState({ player1: '', player2: '' });
  const [sets, setSets] = useState([{ pair1Score: '', pair2Score: '' }, { pair1Score: '', pair2Score: '' }]);
  const [showThirdSet, setShowThirdSet] = useState(false);
  const [date, setDate] = useState(null);
  const [location, setLocation] = useState('');
  const [addedBy, setAddedBy] = useState(localStorage.getItem('addedBy') || '');
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lógica de Jugadores Disponibles
  const getAvailablePlayers = useCallback((currentPairKey, currentPlayerValue, allPairs) => {
    const selectedPlayersInOtherPairs = [];
    if (currentPairKey.startsWith('pair1')) {
        if(allPairs.pair2.player1) selectedPlayersInOtherPairs.push(allPairs.pair2.player1);
        if(allPairs.pair2.player2) selectedPlayersInOtherPairs.push(allPairs.pair2.player2);
    } else {
        if(allPairs.pair1.player1) selectedPlayersInOtherPairs.push(allPairs.pair1.player1);
        if(allPairs.pair1.player2) selectedPlayersInOtherPairs.push(allPairs.pair1.player2);
    }

    const ownPartner = currentPairKey.endsWith('player1') 
        ? allPairs[currentPairKey.substring(0,5)].player2 
        : allPairs[currentPairKey.substring(0,5)].player1;

    return PLAYERS_LIST.filter(
      (p) => p === currentPlayerValue || (p !== ownPartner && !selectedPlayersInOtherPairs.includes(p))
    );
  }, []);

  // Manejadores
  const handlePlayerChange = useCallback((pair, playerKey, value) => {
    const setter = pair === 'pair1' ? setPair1 : setPair2;
    setter(prev => ({ ...prev, [playerKey]: value }));
    if (errors.players) setErrors(prev => ({...prev, players: undefined}));
  }, [errors.players]);

  const handleSetChange = (index, scoreField, value) => {
    const updatedSets = sets.map((s, i) => i === index ? { ...s, [scoreField]: value } : s);
    setSets(updatedSets);
    if (errors[`set${index}`]) setErrors(prev => ({...prev, [`set${index}`]: undefined}));
    if (errors.setsGlobal) setErrors(prev => ({...prev, setsGlobal: undefined}));
  };

  const toggleThirdSet = () => {
    if (showThirdSet) {
        setShowThirdSet(false);
        setSets(sets.slice(0, 2));
        if (errors.set2) setErrors(prev => ({...prev, set2: undefined})); // set2 es el tercer set (index 2)
    } else {
        setShowThirdSet(true);
        setSets([...sets, { pair1Score: '', pair2Score: '' }]);
    }
  };

  // Validación
  const validateForm = () => {
    const newErrors = {};
    const allSelectedPlayers = [pair1.player1, pair1.player2, pair2.player1, pair2.player2].filter(Boolean);

    if (allSelectedPlayers.length !== 4) newErrors.players = "Selecciona los 4 jugadores.";
    else if (new Set(allSelectedPlayers).size !== 4) newErrors.players = "Jugadores repetidos.";

    if (!date || !dayjs(date).isValid()) newErrors.date = "Fecha inválida.";
    if (!location) newErrors.location = "Falta la ubicación.";
    if (!addedBy.trim()) newErrors.addedBy = "Tu nombre es obligatorio.";

    const finalSets = showThirdSet ? sets : sets.slice(0, 2);
    let p1Wins = 0, p2Wins = 0;

    finalSets.forEach((set, i) => {
        const s1 = set.pair1Score; 
        const s2 = set.pair2Score;
        if (s1 === '' || s2 === '') {
            newErrors[`set${i}`] = "Faltan puntos."; 
            return;
        }
        const n1 = parseInt(s1, 10);
        const n2 = parseInt(s2, 10);

        if (isNaN(n1) || isNaN(n2) || n1 < 0 || n1 > 7 || n2 < 0 || n2 > 7) newErrors[`set${i}`] = "0-7 solamente.";
        else if (n1 === n2) newErrors[`set${i}`] = "Sin empates.";
        else if (Math.max(n1, n2) < 6 && Math.max(n1,n2) !== 0) newErrors[`set${i}`] = "Mínimo 6 juegos.";
        else if (Math.max(n1, n2) === 6 && Math.abs(n1 - n2) < 2) newErrors[`set${i}`] = "Diferencia de 2.";
        else if (Math.max(n1, n2) === 7 && (Math.min(n1, n2) < 5 || Math.min(n1, n2) > 6)) newErrors[`set${i}`] = "7-5 o 7-6.";

        if (!newErrors[`set${i}`]) {
            if (n1 > n2) p1Wins++; else p2Wins++;
        }
    });

    if (!Object.keys(newErrors).some(k => k.startsWith('set'))) {
        if (p1Wins === p2Wins && finalSets.length === 2) {
            if (!showThirdSet) newErrors.setsGlobal = "Empate 1-1: Añade 3er set.";
        } else if (showThirdSet && p1Wins + p2Wins < 3 && finalSets.every(s => s.pair1Score && s.pair2Score)) {
            // Lógica opcional estricta
        }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
        const firstError = Object.keys(errors)[0];
        const el = document.getElementById(firstError) || document.getElementById(`${firstError}-label`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "results"), {
        pair1, pair2,
        sets: showThirdSet ? sets : sets.slice(0, 2),
        date: dayjs(date).format('YYYY-MM-DD'),
        location, addedBy,
        createdAt: serverTimestamp(),
      });
      localStorage.setItem('addedBy', addedBy);
      navigate('/');
    } catch (err) {
      console.error(err);
      setErrors({ submit: "Error al guardar. Intenta de nuevo." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    pair1, pair2, sets, showThirdSet, date, location, addedBy,
    errors, isSubmitting,
    setPair1, setPair2, setDate, setLocation, setAddedBy,
    handlePlayerChange, handleSetChange, toggleThirdSet, handleSubmit, getAvailablePlayers
  };
};