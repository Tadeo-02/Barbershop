import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./barbers.module.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Trash2 } from "lucide-react";

interface Barbero {
  cuil: string;
  nombre: string;
  apellido: string;
}

const IndexBarbers = () => {
  const [barberos, setBarberos] = useState<Barbero[]>([]);
  //? alerts para manejar los mensajes
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    // Llama al backend para obtener los barberos
    fetch("/barberos")
      .then((res) => res.json())
      .then((data) => {
        setBarberos(data); // data debe ser un array de barberos
        console.log("Barberos recibidos:", data);
      })
      .catch((error) => {
        console.error("Error al obtener barberos:", error);
      });
  }, []);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({
      show: true,
      type,
      message,
    });
    // Auto-ocultar después de 5 segundos
    setTimeout(() => setAlert(null), 5000);
  };

  const handleDelete = async (cuil: string) => {
    try {
      const response = await fetch(`/barberos/${cuil}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showAlert("success", "Barbero eliminado correctamente.");
        // Actualizar la lista de barberos removiendo el barbero eliminado
        setBarberos(barberos.filter((barbero) => barbero.cuil !== cuil));
      } else if (response.status === 404) {
        showAlert("error", "Barbero no encontrado.");
      } else {
        showAlert("error", "Error al borrar el barbero.");
      }
    } catch (error) {
      console.error("Error en la solicitud:", error);
      showAlert("error", "Error de conexión con el servidor.");
    }
  };

  return (
    <div className={styles.indexBarberos}>
      <h2>Gestión de Barberos</h2>
      {/* Mostrar alert si existe */}
      {alert && (
        <Alert
          variant={alert.type === "error" ? "destructive" : "default"}
          className="mb-4"
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {alert.type === "success" ? "Éxito" : "Error"}
          </AlertTitle>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}
      {barberos.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No hay barberos disponibles.</p>
        </div>
      ) : (
        <ul>
          {barberos.map((barbero, idx) => (
            <li key={idx}>
              <div className={styles.barberoInfo}>
                <div className={styles.barberoTitle}>
                  {barbero.apellido}, {barbero.nombre}
                </div>
                <div className={styles.barberoCode}>CUIL: {barbero.cuil}</div>
              </div>
              <div className={styles.actionButtons}>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/barbers/${barbero.cuil}`}>
                    Ver Detalles
                  </Link>
                </Button>
                <Button asChild variant="default" size="sm">
                  <Link to={`/barbers/updateBarber/${barbero.cuil}`}>
                    Modificar
                  </Link>
                </Button>
                {/* Reemplazar el botón de eliminar por este AlertDialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará
                        permanentemente el barbero{" "}
                        <strong>
                          {barbero.apellido}, {barbero.nombre}
                        </strong>
                        .
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(barbero.cuil)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default IndexBarbers;
