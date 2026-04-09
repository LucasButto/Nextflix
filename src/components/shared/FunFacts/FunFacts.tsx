import type { FunFact } from "@/utils/funFacts";
import "./FunFacts.scss";

interface FunFactsProps {
  title: string;
  facts: FunFact[];
}

export default function FunFacts({ title, facts }: FunFactsProps) {
  if (facts.length === 0) return null;

  return (
    <div className="fun-facts">
      <h3 className="section-title">{title}</h3>
      <div className="fun-facts__grid">
        {facts.map((fact) => (
          <div key={fact.label} className="fun-facts__item">
            <span className="fun-facts__label">{fact.label}</span>
            <span className="fun-facts__value">{fact.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
