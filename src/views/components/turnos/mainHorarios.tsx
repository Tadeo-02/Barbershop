// src/components/Calendar.tsx
import React, { useState, useEffect } from "react";
import styles from "./mainHorarios.module.css";

// Definición de tipos para las props del componente Day
interface DayProps {
  dayNumber: number | null;
  isSelected: boolean;
  onSelect: (day: number) => void;
}

const Day: React.FC<DayProps> = ({ dayNumber, isSelected, onSelect }) => {
  const handleClick = () => {
    if (dayNumber !== null) {
      onSelect(dayNumber);
    }
  };

  return (
    <div
      className={`${styles.day} ${dayNumber === null ? styles.empty : ""} ${
        isSelected ? styles.selected : ""
      }`}
      onClick={handleClick}
    >
      {dayNumber}
    </div>
  );
};

const MainHorarios: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [daysInMonth, setDaysInMonth] = useState<(number | null)[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    generateCalendarDays(currentDate);
  }, [currentDate]);

  const generateCalendarDays = (date: Date): void => {
    const year: number = date.getFullYear();
    const month: number = date.getMonth();

    // Obtener el primer día del mes
    const firstDayOfMonth: Date = new Date(year, month, 1);
    const startingDay: number = firstDayOfMonth.getDay(); // 0 para domingo, 1 para lunes, etc.

    // Obtener el último día del mes
    const lastDayOfMonth: Date = new Date(year, month + 1, 0);
    const numDays: number = lastDayOfMonth.getDate();

    const days: (number | null)[] = [];

    // Rellenar con días vacíos al principio si el mes no empieza en domingo
    for (let i = 0; i < startingDay; i++) {
      days.push(null); // Usamos null para representar días vacíos
    }

    // Rellenar con los días del mes
    for (let i = 1; i <= numDays; i++) {
      days.push(i);
    }

    setDaysInMonth(days);
  };

  const goToPreviousMonth = (): void => {
    setCurrentDate((prevDate: Date) => {
      const newDate: Date = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = (): void => {
    setCurrentDate((prevDate: Date) => {
      const newDate: Date = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const monthNames: string[] = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const dayNames: string[] = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className={styles.calendar}>
      <div className={styles["calendar-header"]}>
        <button onClick={goToPreviousMonth}>&lt;</button>
        <h2>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={goToNextMonth}>&gt;</button>
      </div>
      <div className={styles["calendar-grid"]}>
        {dayNames.map((day: string) => (
          <div key={day} className={styles["day-name"]}>
            {day}
          </div>
        ))}
        {daysInMonth.map((day: number | null, index: number) => (
          <Day
            key={index}
            dayNumber={day}
            isSelected={day === selectedDay}
            onSelect={setSelectedDay}
          />
        ))}
      </div>
      {selectedDay && (
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          Seleccionaste: {selectedDay} de {monthNames[currentDate.getMonth()]}{" "}
          {currentDate.getFullYear()}
        </div>
      )}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          style={{
            backgroundColor: selectedDay ? "#007bff" : "#ccc",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "4px",
            cursor: selectedDay ? "pointer" : "not-allowed",
            fontSize: "1em",
          }}
          disabled={!selectedDay}
          onClick={() =>
            alert(
              `Fecha seleccionada: ${selectedDay} de ${
                monthNames[currentDate.getMonth()]
              } ${currentDate.getFullYear()}`
            )
          }
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default MainHorarios;
