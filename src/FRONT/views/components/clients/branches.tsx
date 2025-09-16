import React from "react";
import styles from "./branches.module.css";
import { useNavigate } from "react-router-dom";

const branches = [
    { id: 1, nombre: "Sucursal Centro", direccion: "Av. Principal 123" },
    { id: 2, nombre: "Sucursal Norte", direccion: "Calle Norte 456" },
    { id: 3, nombre: "Sucursal Sur", direccion: "Av. Sur 789" },
];

const Branches = () => {
    const navigate = useNavigate();
    const [selectedBranch, setSelectedBranch] = React.useState<number | null>(null);
    const [showOptions, setShowOptions] = React.useState(false);

    const handleSelectBranch = (id: number) => {
        setSelectedBranch(id);
        setShowOptions(true);
    };

    const handleBarberFirst = () => {
        navigate(`/branches/${selectedBranch}/barbers`);
    };
    const handleScheduleFirst = () => {
        navigate(`/branches/${selectedBranch}/schedule`);
    };

    return (
        <div className={styles.branchesContainer}>
            <h2>Sucursales disponibles</h2>
            <ul className={styles.branchList}>
                {branches.map((branch) => (
                    <li key={branch.id} className={styles.branchItem} onClick={() => handleSelectBranch(branch.id)} style={{cursor: 'pointer'}}>
                        <div className={styles.branchName}>{branch.nombre}</div>
                        <div className={styles.branchAddress}>{branch.direccion}</div>
                    </li>
                ))}
            </ul>
            {showOptions && (
                <div className={styles.optionsContainer}>
                    <h3>¿Cómo quieres buscar tu turno?</h3>
                    <button className={styles.optionButton} onClick={handleBarberFirst}>
                        Elegir barbero
                    </button>
                    <button className={styles.optionButton} onClick={handleScheduleFirst}>
                        Elegir horario
                    </button>
                </div>
            )}
        </div>
    );
};

export default Branches;
