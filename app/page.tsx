'use client'
import Image from "next/image";
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import Link from 'next/link';
/*
    <FullCalendar
    plugins={[ dayGridPlugin ]}
    initialView="dayGridMonth"
  />
  */
export default function Home() {
  return (
    <div className="w-full h-full">
      <Link href="/schedule">
        <button>Schedule</button>
      </Link>
      <FullCalendar
          plugins={[ dayGridPlugin ]}
          initialView="dayGridMonth"
        />
    </div>
    

  );
}
