    import { useEffect, useState } from "react";
    import { useParams } from "react-router-dom";

    const ShowBarbero = () => {
    const { cuil } = useParams(); // si lo pasás como parámetro de URL
    const [barbero, setBarbero] = useState(null);

    useEffect(() => {
        fetch(`/barberos/${cuil}`)
        .then((res) => res.json())
        .then((data) => setBarbero(data))
        .catch((err) => console.error("Error al obtener el barbero:", err));
    }, [cuil]);

    if (!barbero) return <div>Cargando barbero...</div>;

    return (
        <div>
        <h1>Cuil: {barbero.cuil}</h1>
        <p>Nombre: {barbero.nombre}</p>
        <p>Apellido: {barbero.apellido}</p>
        <p>Telefono: {barbero.telefono}</p>
        </div>
    );
    };

    export default ShowBarbero;
