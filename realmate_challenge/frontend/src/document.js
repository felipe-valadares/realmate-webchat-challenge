import Document, { Html, Head, Main, NextScript } from 'next/document';
import { ColorModeScript } from '@chakra-ui/react';
import customTheme from './theme';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="pt">
        <Head />
        <body>
          {/* garante que o Chakra lê o color mode inicial sem flash */}
          <ColorModeScript initialColorMode={customTheme.config.initialColorMode} />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;