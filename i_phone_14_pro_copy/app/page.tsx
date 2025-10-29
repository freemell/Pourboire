import Spline from '@splinetool/react-spline/next';
export default function Home() {
  return (
	<main>
	  <Spline
		scene="scene.splinecode"
		wasmPath="/"
	  />
	</main>
  );
}
