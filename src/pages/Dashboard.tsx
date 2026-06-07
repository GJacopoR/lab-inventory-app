import React from 'react';
import { Card } from '../components/ui/Card';
import { SectionContainer } from '../components/ui/SectionContainer';
import { AnimatedPage } from '../components/ui/PageHeader';

/** Dashboard – four real actions with stronger composition */
const Dashboard: React.FC = () => {
  const actions = [
    {
      to: '/inventory',
      title: 'Inventario',
      desc: "Vedi e gestisci l'inventario",
      variant: 'primary' as const,
    },
    {
      to: '/recipes',
      title: 'Ricette',
      desc: 'Vedi e gestisci le ricette',
      variant: 'secondary' as const,
    },
    {
      to: '/documents',
      title: 'Documenti',
      desc: 'Carica un documento',
      variant: 'secondary' as const,
    },
    {
      to: '/labels',
      title: 'Etichette',
      desc: "Stampa un'etichetta",
      variant: 'secondary' as const,
    },
  ];

  return (
    <AnimatedPage>
      <SectionContainer>
        {/* Hero section */}
        <section className="mb-6 md:mb-8 p-4 md:p-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl md:rounded-2xl text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Operazioni di Inventario</h1>
          <p className="mt-2 text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Gestisci l'inventario, le ricette, carica documenti e stampa etichette.
          </p>
        </section>

        {/* Tile layout - stack on mobile, 2/3 cols on desktop */}
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
          {actions.map((a, i) => (
            <Card
              key={a.to}
              to={a.to}
              title={a.title}
              description={a.desc}
              variant={i === 0 ? 'primary' : 'secondary'}
              className={i === 0 ? 'col-span-1 md:col-span-2' : 'col-span-1'}
            />
          ))}
        </div>
      </SectionContainer>
    </AnimatedPage>
  );
};

export default Dashboard;