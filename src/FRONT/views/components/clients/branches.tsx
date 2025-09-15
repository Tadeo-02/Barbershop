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
    const handleSelectBranch = (id: number) => {
        navigate(`/branches/${id}`);
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
        </div>
    );
};

export default Branches;
