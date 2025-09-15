
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './home.module.css';

const Home = () => {
	const navigate = useNavigate();

			const handleSolicitarTurno = () => {
				navigate('/branches');
			};

	return (
		<div className={styles.homeContainer}>
			<h2>Bienvenido</h2>
			<div className={styles.optionsContainer}>
				<button className={styles.optionButton} onClick={handleSolicitarTurno}>
					Solicitar turno
				</button>
				<button className={styles.optionButton} disabled>
					Comprar productos
				</button>
			</div>
		</div>
	);
};

export default Home;
