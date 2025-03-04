/* eslint-disable @typescript-eslint/indent */
import { useEffect, useState } from 'react';
import { useFetcher, useNavigate } from '@remix-run/react';
import { Modal, Loading, Button } from '@nextui-org/react';
import { ClientOnly } from 'remix-utils';

import useWindowSize from '~/hooks/useWindowSize';
import { IMovieTranslations } from '~/services/tmdb/tmdb.types';
import { H3 } from '~/src/components/styles/Text.styles';

type SelectProviderModalProps = {
  id: number | string | undefined;
  visible: boolean;
  closeHandler: () => void;
  type: 'movie' | 'tv' | 'anime';
  title: string;
  origTitle: string;
  year: number;
  translations?: IMovieTranslations;
  season?: number;
  episode?: number;
  episodeId?: string;
};

const SelectProviderModal = ({
  id,
  visible,
  closeHandler,
  type,
  title,
  origTitle,
  year,
  translations,
  season,
  episode,
  episodeId,
}: SelectProviderModalProps) => {
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<{ id: string | number; provider: string }[]>();
  const { width } = useWindowSize();
  const findTranslation = translations?.translations.find((item) => item.iso_639_1 === 'en');
  const handleProvider = (item: { id: string | number; provider: string }) => {
    if (type === 'movie') navigate(`/movies/${id}/watch?provider=${item.provider}&id=${item.id}`);
    else if (type === 'tv')
      navigate(
        `/tv-shows/${id}/season/${season}/episode/${episode}?provider=${item.provider}&id=${item.id}`,
      );
    else if (type === 'anime')
      navigate(
        `/anime/${id}/episode/${episodeId}?provider=${item.provider}&id=${item.id}&episode=${episode}`,
      );
  };
  useEffect(() => {
    if (visible) {
      if (type === 'movie')
        fetcher.load(
          `/api/provider?title=${
            findTranslation ? findTranslation.data?.title : title
          }&type=${type}&origTitle=${origTitle}&year=${year}`,
        );
      else if (type === 'tv')
        fetcher.load(
          `/api/provider?title=${
            findTranslation ? findTranslation.data?.name : title
          }&type=${type}&origTitle=${origTitle}&year=${year}&season=${season}`,
        );
      else if (type === 'anime')
        fetcher.load(
          `/api/provider?title=${title}&type=${type}&origTitle=${origTitle}&year=${year}&episodeId=${episodeId}`,
        );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (fetcher.data && fetcher.data.provider) {
      setProvider(fetcher.data.provider);
    }
  }, [fetcher.data]);

  return (
    <ClientOnly fallback={<Loading type="default" />}>
      {() => (
        <Modal
          closeButton
          blur
          scroll
          aria-labelledby="Select Provider"
          open={visible}
          onClose={closeHandler}
          width={width && width < 720 ? `${width}px` : '720px'}
        >
          <Modal.Header css={{ display: 'flex', flexFlow: 'row wrap' }}>
            <H3 h3 css={{ margin: '0 0 $8 0' }}>
              Select Provider
            </H3>
          </Modal.Header>
          <Modal.Body
            css={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {provider && Array.isArray(provider)
              ? provider.map((item) => (
                  <Button
                    key={item.id}
                    light
                    css={{ '@hover': { color: '$primaryLightContrast' } }}
                    onClick={() => handleProvider(item)}
                  >
                    {item.provider}
                  </Button>
                ))
              : null}
            {fetcher.type === 'normalLoad' && (
              <div role="status" className="max-w-sm animate-pulse">
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4" />
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4" />
                <div className="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4" />
                <span className="sr-only">Loading...</span>
              </div>
            )}
          </Modal.Body>
        </Modal>
      )}
    </ClientOnly>
  );
};

export default SelectProviderModal;
