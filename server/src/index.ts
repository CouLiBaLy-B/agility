import { env } from './env';
import { createApp } from './app';

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Agility API listening on http://localhost:${env.PORT}`);
});
