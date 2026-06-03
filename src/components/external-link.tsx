import { Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

// href'in yalnızca string üyeleri (nesne formu hariç): hem <Link href> hem
// openBrowserAsync(string) için geçerli. typedRoutes üretilsin/üretilmesin sağlam.
type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: Extract<ComponentProps<typeof Link>['href'], string>;
};

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
