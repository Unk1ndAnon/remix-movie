/* eslint-disable @typescript-eslint/indent */
import { useLoaderData, useNavigate, useLocation, Link } from '@remix-run/react';
import { json, LoaderFunction, MetaFunction } from '@remix-run/node';
import { Container, Pagination } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useRouteData } from 'remix-utils';
import type { User } from '@supabase/supabase-js';

import { getListTvShows, getListGenre, getListDiscover } from '~/services/tmdb/tmdb.server';
import MediaList from '~/src/components/media/MediaList';
import useMediaQuery from '~/hooks/useMediaQuery';
import i18next from '~/i18n/i18next.server';

type LoaderData = {
  shows: Awaited<ReturnType<typeof getListTvShows>>;
  withGenres?: string;
  sortBy?: string;
};

export const meta: MetaFunction = () => ({
  title: 'Discover and Watch movies and tv shows free | Sora',
  description:
    'Official Sora website to watch movies online HD for free, Watch TV show & TV series and Download all movies and series FREE',
  keywords:
    'watch free movies, free movies to watch online, watch movies online free, free movies streaming, free movies full, free movies download, watch movies hd, movies to watch',
  'og:url': 'https://sora-movie.vervel.app/tv-shows/discover',
  'og:title': 'Discover and Watch movies and tv shows free | Sora',
  'og:description':
    'Official Sora website to watch movies online HD for free, Watch TV show & TV series and Download all movies and series FREE',
});

export const loader: LoaderFunction = async ({ request }) => {
  const locale = await i18next.getLocale(request);
  const url = new URL(request.url);
  let page = Number(url.searchParams.get('page')) || undefined;
  const genres = await getListGenre('tv', locale);
  if (page && (page < 1 || page > 1000)) page = 1;

  const withGenres = url.searchParams.get('with_genres') || undefined;
  let sortBy = url.searchParams.get('sort_by') || undefined;
  if (sortBy && !sortBy.includes('.')) sortBy += sortBy === 'original_title' ? '.asc' : '.desc';

  return json<LoaderData>({
    shows:
      sortBy || genres
        ? await getListDiscover('tv', withGenres, sortBy, locale, page)
        : await getListTvShows('on_the_air', locale, page),
    withGenres,
    sortBy,
  });
};

export const handle = {
  breadcrumb: () => <Link to="/tv-shows?index">Discover Tv</Link>,
};

const ListTvShows = () => {
  const { shows, withGenres, sortBy } = useLoaderData<LoaderData>();
  const rootData:
    | {
        user?: User;
        locale: string;
        genresMovie: { [id: string]: string };
        genresTv: { [id: string]: string };
      }
    | undefined = useRouteData('root');
  const navigate = useNavigate();
  const location = useLocation();
  const isXs = useMediaQuery(650);
  const { t } = useTranslation();

  const paginationChangeHandler = (page: number) => {
    let url = `?page=${page}`;

    if (withGenres) url += `&with_genres=${withGenres}`;
    if (sortBy) url += `&sort_by=${sortBy}`;

    navigate(url);
  };
  return (
    <motion.div
      key={location.key}
      initial={{ x: '-10%', opacity: 0 }}
      animate={{ x: '0', opacity: 1 }}
      exit={{ y: '-10%', opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Container
        fluid
        display="flex"
        justify="center"
        direction="column"
        alignItems="center"
        css={{
          '@xsMax': {
            paddingLeft: 'calc(var(--nextui-space-sm))',
            paddingRight: 'calc(var(--nextui-space-sm))',
          },
        }}
      >
        {shows && shows.items && shows.items.length > 0 && (
          <MediaList
            items={shows.items}
            listName={t('discoverTv')}
            showFilter
            genresMovie={rootData?.genresMovie}
            genresTv={rootData?.genresTv}
            mediaType="tv"
          />
        )}
        <Pagination
          total={shows.totalPages}
          initialPage={shows.page}
          shadow
          onChange={paginationChangeHandler}
          css={{ marginTop: '30px' }}
          {...(isXs && { size: 'xs' })}
        />
      </Container>
    </motion.div>
  );
};

export default ListTvShows;
