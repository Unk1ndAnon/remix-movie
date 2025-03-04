/* eslint-disable @typescript-eslint/no-throw-literal */
import * as React from 'react';
import { LoaderFunction, json, MetaFunction } from '@remix-run/node';
import { useCatch, useLoaderData, Outlet, Link, RouteMatch, useFetcher } from '@remix-run/react';
import { Container } from '@nextui-org/react';

import {
  getTvShowDetail,
  getTranslations,
  getTvShowIMDBId,
  getImdbRating,
} from '~/services/tmdb/tmdb.server';
import i18next from '~/i18n/i18next.server';
import TMDB from '~/utils/media';
import MediaDetail from '~/src/components/media/MediaDetail';
import WatchTrailerModal, { Trailer } from '~/src/components/elements/modal/WatchTrailerModal';
import CatchBoundaryView from '~/src/components/CatchBoundaryView';
import ErrorBoundaryView from '~/src/components/ErrorBoundaryView';

type LoaderData = {
  detail: Awaited<ReturnType<typeof getTvShowDetail>>;
  translations?: Awaited<ReturnType<typeof getTranslations>>;
  imdbRating?: { count: number; star: number };
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const locale = await i18next.getLocale(request);
  const { tvId } = params;
  const tid = Number(tvId);
  if (!tid) throw new Response('Not Found', { status: 404 });

  const [detail, imdbId] = await Promise.all([getTvShowDetail(tid, locale), getTvShowIMDBId(tid)]);
  if (!detail) throw new Response('Not Found', { status: 404 });
  if ((detail && detail?.original_language !== 'en') || locale !== 'en') {
    const [translations, imdbRating] = await Promise.all([
      getTranslations('tv', tid),
      imdbId ? getImdbRating(imdbId) : undefined,
    ]);
    return json<LoaderData>({ detail, translations, imdbRating });
  }

  const imdbRating = imdbId ? await getImdbRating(imdbId) : undefined;
  return json<LoaderData>({ detail, imdbRating });
};

export const meta: MetaFunction = ({ data, params }) => {
  if (!data) {
    return {
      title: 'Missing Movie',
      description: `There is no movie with the ID: ${params.tvId}`,
    };
  }
  const { detail } = data;
  return {
    title: `Watch ${detail.name} HD online Free - Sora`,
    description: `Watch ${detail.name} in full HD online with Subtitle - No sign up - No Buffering - One Click Streaming`,
    keywords: `Watch ${detail.name}, Stream ${detail.name}, Watch ${detail.name} HD, Online ${detail.name}, Streaming ${detail.name}, English, Subtitle ${detail.name}, English Subtitle`,
    'og:url': `https://sora-movie.vercel.app/tv-shows/${params.tvId}`,
    'og:title': `Watch ${detail.name} HD online Free - Sora`,
    'og:description': `Watch ${detail.name} in full HD online with Subtitle - No sign up - No Buffering - One Click Streaming`,
    'og:image': TMDB.backdropUrl(detail?.backdrop_path || '', 'w780'),
  };
};

export const handle = {
  breadcrumb: (match: RouteMatch) => (
    <Link to={`/tv-shows/${match.params.tvId}`}>{match.params.tvId}</Link>
  ),
};

const TvShowDetail = () => {
  const { detail, translations, imdbRating } = useLoaderData<LoaderData>();
  console.log('🚀 ~ file: $tvId.tsx ~ line 75 ~ TvShowDetail ~ detail', detail);
  const fetcher = useFetcher();
  const [visible, setVisible] = React.useState(false);
  const [trailer, setTrailer] = React.useState<Trailer>({});
  const Handler = (id: number) => {
    setVisible(true);
    fetcher.load(`/tv-shows/${id}/videos`);
  };
  const closeHandler = () => {
    setVisible(false);
    setTrailer({});
  };
  React.useEffect(() => {
    if (fetcher.data && fetcher.data.videos) {
      const { results } = fetcher.data.videos;
      const officialTrailer = results.find((result: Trailer) => result.type === 'Trailer');
      setTrailer(officialTrailer);
    }
  }, [fetcher.data]);

  return (
    <>
      <MediaDetail
        type="tv"
        item={detail}
        handler={Handler}
        translations={translations}
        imdbRating={imdbRating}
      />
      <Container
        as="div"
        fluid
        responsive
        css={{
          margin: 0,
          padding: 0,
        }}
      >
        <Outlet />
      </Container>
      <WatchTrailerModal trailer={trailer} visible={visible} closeHandler={closeHandler} />
    </>
  );
};

export const CatchBoundary = () => {
  const caught = useCatch();

  return <CatchBoundaryView caught={caught} />;
};

export const ErrorBoundary = ({ error }: { error: Error }) => {
  const isProd = process.env.NODE_ENV === 'production';

  return <ErrorBoundaryView error={error} isProd={isProd} />;
};

export default TvShowDetail;
