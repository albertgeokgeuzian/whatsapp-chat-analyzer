import { HelpCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface Props {
  text: string;
}

export function InfoTooltip({ text }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const toggleTooltip = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div
      className="tooltip-container"
      ref={tooltipRef}
      onClick={toggleTooltip}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <HelpCircle
        size={15}
        className={`tooltip-icon ${isOpen ? "active" : ""}`}
      />
      <div className={`tooltip-content ${isOpen ? "show" : ""}`}>{text}</div>
    </div>
  );
}
