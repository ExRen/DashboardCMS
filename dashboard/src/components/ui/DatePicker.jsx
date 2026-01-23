import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from './Button'

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function DatePicker({ value, onChange, placeholder = "Pilih tanggal..." }) {
    const [showCalendar, setShowCalendar] = useState(false)
    const [inputValue, setInputValue] = useState(value || '')
    const [currentDate, setCurrentDate] = useState(new Date())
    const containerRef = useRef(null)

    useEffect(() => {
        setInputValue(value || '')
    }, [value])

    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowCalendar(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function parseDate(dateStr) {
        if (!dateStr) return null
        const parts = dateStr.split(' ')
        if (parts.length >= 3) {
            const day = parseInt(parts[0])
            const monthIndex = MONTHS.findIndex(m => m.toLowerCase() === parts[1].toLowerCase())
            const year = parseInt(parts[2])
            if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
                return new Date(year, monthIndex, day)
            }
        }
        return null
    }

    function formatDate(date) {
        const day = date.getDate()
        const month = MONTHS[date.getMonth()]
        const year = date.getFullYear()
        return `${day} ${month} ${year}`
    }

    function handleInputChange(e) {
        const val = e.target.value
        setInputValue(val)
        onChange(val)
    }

    function handleDateSelect(day) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
        const formatted = formatDate(date)
        setInputValue(formatted)
        onChange(formatted)
        setShowCalendar(false)
    }

    function prevMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    }

    function nextMonth() {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    }

    function getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    function getFirstDayOfMonth(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    function setToday() {
        const today = new Date()
        const formatted = formatDate(today)
        setInputValue(formatted)
        onChange(formatted)
        setCurrentDate(today)
        setShowCalendar(false)
    }

    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

    const parsedDate = parseDate(inputValue)
    const isCurrentMonth = parsedDate &&
        parsedDate.getMonth() === currentDate.getMonth() &&
        parsedDate.getFullYear() === currentDate.getFullYear()
    const selectedDay = isCurrentMonth ? parsedDate.getDate() : null

    const todayDate = new Date()
    const isToday = (day) =>
        todayDate.getDate() === day &&
        todayDate.getMonth() === currentDate.getMonth() &&
        todayDate.getFullYear() === currentDate.getFullYear()

    return (
        <div className="relative" ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full h-10 pl-3 pr-10 rounded-lg bg-muted border border-border text-sm"
                />
                <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded"
                >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {showCalendar && (
                <div className="absolute z-50 mt-1 p-3 bg-card border border-border rounded-lg shadow-lg w-[280px]">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={prevMonth} className="p-1 hover:bg-muted rounded">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <button type="button" onClick={nextMonth} className="p-1 hover:bg-muted rounded">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map(d => (
                            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-1">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                            if (day === null) return <div key={`empty-${index}`} />
                            return (
                                <button
                                    key={day}
                                    type="button"
                                    onClick={() => handleDateSelect(day)}
                                    className={`
                    aspect-square flex items-center justify-center text-sm rounded-lg transition-colors
                    ${selectedDay === day ? 'bg-primary text-primary-foreground' : ''}
                    ${isToday(day) && selectedDay !== day ? 'bg-accent font-bold' : ''}
                    ${selectedDay !== day && !isToday(day) ? 'hover:bg-muted' : ''}
                  `}
                                >
                                    {day}
                                </button>
                            )
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <button
                            type="button"
                            onClick={setToday}
                            className="text-xs text-primary hover:underline"
                        >
                            Hari ini
                        </button>
                        <div className="text-xs text-muted-foreground">
                            Format: 1 Januari 2025
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
