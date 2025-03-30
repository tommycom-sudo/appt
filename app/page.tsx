'use client'
import Image from "next/image";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
/*
    <FullCalendar
    plugins={[ dayGridPlugin ]}
    initialView="dayGridMonth"
  />
  */
export default function Home() {
  return (
    <FullCalendar
    plugins={[ dayGridPlugin ]}
    initialView="dayGridMonth"
  />

  );
}
