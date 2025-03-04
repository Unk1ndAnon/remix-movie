/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-throw-literal */
import * as React from 'react';
import { LoaderFunction, json, MetaFunction } from '@remix-run/node';
import { useLoaderData, useFetcher } from '@remix-run/react';
import { Row, Col, Button, Grid, Card } from '@nextui-org/react';

import i18next from '~/i18n/i18next.server';
import { getTvSeasonVideos } from '~/services/tmdb/tmdb.server';
import { Item } from '~/services/youtube/youtube.types';
import useMediaQuery from '~/hooks/useMediaQuery';
import WatchTrailerModal, { Trailer } from '~/src/components/elements/modal/WatchTrailerModal';
import { H5, H6 } from '~/src/components/styles/Text.styles';

type LoaderData = {
  videos: Awaited<ReturnType<typeof getTvSeasonVideos>>;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const locale = await i18next.getLocale(request);
  const { tvId, seasonId } = params;
  const tid = Number(tvId);

  if (!tid) throw new Response('Not Found', { status: 404 });
  const videos = await getTvSeasonVideos(tid, Number(seasonId), locale);

  if (!videos) throw new Response('Not Found', { status: 404 });

  return json<LoaderData>({ videos });
};

export const meta: MetaFunction = ({ params }) => ({
  'og:url': `https://sora-movie.vercel.app/tv-shows/${params.tvId}/season/${params.seasonId}/videos`,
});

const VideosPage = () => {
  const { videos } = useLoaderData<LoaderData>();
  const fetcher = useFetcher();
  const isSm = useMediaQuery(650, 'max');
  const [activeType, setActiveType] = React.useState<number>(0);
  const [activeTypeVideos, setActiveTypeVideos] = React.useState<Item[] | []>([]);
  const [visible, setVisible] = React.useState(false);
  const [trailer, setTrailer] = React.useState<Trailer>({});

  const closeHandler = () => {
    setVisible(false);
    setTrailer({});
  };
  const typeVideo = [
    {
      activeType: 0,
      activeVideo: 'Trailer',
    },
    {
      activeType: 1,
      activeVideo: 'Teaser',
    },
    {
      activeType: 2,
      activeVideo: 'Clip',
    },
    {
      activeType: 3,
      activeVideo: 'Behind the Scenes',
    },
    {
      activeType: 4,
      activeVideo: 'Bloopers',
    },
    {
      activeType: 5,
      activeVideo: 'Featurette',
    },
    {
      activeType: 6,
      activeVideo: 'Opening Credits',
    },
  ];
  React.useEffect(() => {
    if (videos) {
      let activeVideo = [];
      const activeTypeVideo = typeVideo.find((item) => item.activeType === activeType);
      activeVideo = videos.results?.filter((video) => video.type === activeTypeVideo?.activeVideo);
      const keyVideo = activeVideo.map((item) => item.key).join(',');
      keyVideo ? fetcher.load(`/api/youtube-video?id=${keyVideo}`) : setActiveTypeVideos([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, videos]);
  React.useEffect(() => {
    if (fetcher.data && fetcher.data.youtubeVideo) {
      setActiveTypeVideos(fetcher.data.youtubeVideo);
    }
  }, [fetcher.data]);

  return (
    <Row
      fluid
      align="stretch"
      justify="center"
      css={{
        marginTop: '0.75rem',
        padding: '0 0.75rem',
        '@xs': {
          padding: '0 3vw',
        },
        '@sm': {
          padding: '0 6vw',
        },
        '@md': {
          padding: '0 12vw',
        },
        flexDirection: isSm ? 'column' : 'row',
      }}
    >
      <Col
        span={isSm ? 12 : 4}
        offset={isSm ? 0 : 0.125}
        css={{ display: 'flex', justifyContent: isSm ? 'flex-start' : 'center' }}
      >
        <Button.Group
          {...(isSm ? { vertical: false } : { vertical: true })}
          css={{
            '@xsMax': {
              width: '100%',
              overflowX: 'auto',
              flexFlow: 'row nowrap',
            },
          }}
        >
          {typeVideo.map((item, index) => (
            <Button
              key={`button-item-${item.activeVideo}`}
              type="button"
              onClick={() => setActiveType(index)}
              {...(activeType === item.activeType ? {} : { ghost: true })}
              css={{
                '@xsMax': {
                  flexGrow: '1',
                  flexShrink: '0',
                  dflex: 'center',
                },
              }}
            >
              {item.activeVideo}
            </Button>
          ))}
        </Button.Group>
      </Col>
      <Col span={isSm ? 12 : 8}>
        <Grid.Container gap={1} justify="flex-start">
          {activeTypeVideos &&
            activeTypeVideos.map((video) => (
              <Grid xs={12} sm={6} key={video.id}>
                <Card
                  as="div"
                  isPressable
                  isHoverable
                  role="figure"
                  css={{ borderWidth: 0 }}
                  onPress={() => {
                    const videoPlay = videos?.results?.find((item) => item.key === video.id);
                    if (videoPlay) {
                      setVisible(true);
                      setTrailer(videoPlay);
                    }
                  }}
                >
                  <Card.Body css={{ p: 0 }}>
                    <Card.Image
                      src={video?.snippet?.thumbnails?.medium?.url}
                      objectFit="cover"
                      width="100%"
                      height="auto"
                      alt={video?.snippet?.title}
                      showSkeleton
                      maxDelay={10000}
                      loading="lazy"
                      title={video?.snippet?.title}
                    />
                  </Card.Body>
                  <Card.Footer
                    css={{
                      justifyItems: 'flex-start',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <H5 h5 weight="bold">
                      {video?.snippet?.title}
                    </H5>
                    <H6 h6 css={{ color: '$accents7', fontWeight: '$semibold', fontSize: '$sm' }}>
                      {video?.snippet?.channelTitle}
                    </H6>
                  </Card.Footer>
                </Card>
              </Grid>
            ))}
        </Grid.Container>
      </Col>
      <WatchTrailerModal trailer={trailer} visible={visible} closeHandler={closeHandler} />
    </Row>
  );
};

export default VideosPage;
