'use client';

import { Check } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import { formatCurrency } from '@/lib/utils';

interface PricingCardProps {
  plan: {
    name: string;
    displayName: string;
    description: string;
    price: number;
    monthlySeoCredits: number;
    monthlyReelCredits: number;
    features: string[];
  };
  currentPlan?: string;
  onSelect: (planName: string) => void;
  isLoading?: boolean;
}

export default function PricingCard({
  plan,
  currentPlan,
  onSelect,
  isLoading,
}: PricingCardProps) {
  const isCurrentPlan = currentPlan === plan.name;
  const isPro = plan.name === 'PRO';

  return (
    <Card
      className={`relative ${
        isPro ? 'border-2 border-primary-500' : ''
      }`}
      hover
    >
      {isPro && (
        <div className="absolute top-0 right-0 bg-primary-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
          Popular
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {plan.displayName}
        </h3>
        <p className="text-gray-600 mt-2">{plan.description}</p>
        <div className="mt-4">
          <span className="text-4xl font-bold text-gray-900">
            {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-600">/month</span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>SEO Articles:</span>
            <span className="font-semibold">
              {plan.monthlySeoCredits === 0 ? 'Sample Only' : `${plan.monthlySeoCredits}/month`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Reel Scripts:</span>
            <span className="font-semibold">
              {plan.monthlyReelCredits === 0 ? 'Sample Only' : `${plan.monthlyReelCredits}/month`}
            </span>
          </div>
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={isPro ? 'primary' : 'outline'}
        className="w-full"
        onClick={() => onSelect(plan.name)}
        disabled={isCurrentPlan || isLoading}
      >
        {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
      </Button>
    </Card>
  );
}

