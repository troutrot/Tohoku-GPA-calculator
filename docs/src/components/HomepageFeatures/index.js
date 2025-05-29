import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Automatic GPA Calculation',
    Svg: require('@site/static/img/Tabler_Icon_Calculator.svg').default,
    description: (
      <>
        Instantly displays your GPA on the grade list page. You can freely edit
        the mapping between grade symbols and GPA values to match your
        university’s system.
      </>
    ),
  },
  {
    title: 'Download Grades as Excel',
    Svg: require('@site/static/img/Tabler_Icons_Table_Down.svg').default,
    description: (
      <>
        Download your course list and grade data in Excel (.xlsx) format with a
        single click. Makes managing your academic records easier than ever.
      </>
    ),
  },
  {
    title: 'Customization & Visualization',
    Svg: require('@site/static/img/Tabler_Icons_Options.svg').default,
    description: (
      <>
        Edit grade symbols, GPA values, and column mappings directly from the
        popup. Visualize your academic progress and GPA trends with intuitive
        graphs.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
