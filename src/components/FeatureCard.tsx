import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  image?: string;
  onClick?: () => void;
}

export function FeatureCard({ icon: Icon, title, description, image, onClick }: FeatureCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {image && (
        <div className="aspect-video w-full overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-[var(--forest-green)] rounded-full flex items-center justify-center">
            <Icon size={20} className="text-white" />
          </div>
          <h4 className="text-[var(--forest-green)]">{title}</h4>
        </div>
        <p className="text-[var(--forest-green)]/70">{description}</p>
      </div>
    </div>
  );
}
