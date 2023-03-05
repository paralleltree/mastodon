import { Chart as ChartJS, registerables } from 'chart.js';
import 'chartjs-adapter-moment';
import { fetchInstanceStats } from 'mastodon/actions/instance_stats';
import Column from 'mastodon/components/column';
import Skeleton from 'mastodon/components/skeleton';
import 'moment';
import PropTypes from 'prop-types';
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Helmet } from 'react-helmet';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { defineMessages, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

ChartJS.register(...registerables);

const messages = defineMessages({
  title: { id: 'column.instance_stats', defaultMessage: 'Instance statistics' },
  delivery_request: { id: 'instance_stats.delivery_request' },
  delivery_success: { id: 'instance_stats.delivery.success' },
  delivery_failure: { id: 'instance_stats.delivery.failure' },
});

const mapStateToProps = state => ({
  instance_stats: state.getIn(['instance_stats', 'instance_stats']),
});

const buildDeliveryStatDatasets = (stats) => {
  const extractSeries = (seriesKey) => stats.map(stat => {
    return { x: stat.time, y: stat[`${seriesKey}_count`] };
  });
  const series = [
    {
      key: 'success',
      color: '#36A2EB',
    },
    {
      key: 'failure',
      color: '#FF6384',
    },
  ];
  const datasets = series.map(series => {
    return {
      label: series.key,
      data: extractSeries(series.key),
      pointStyle: false,
      tension: 0.1,
      borderColor: series.color,
    };
  });
  return { datasets };
};

const renderStats = (stats) => {
  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'rounded',
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'YYYY/MM/DD HH:00',
          displayFormats: {
            hour: 'DD HH:00',
            day: 'MM/DD',
          },
        },
      },
      y: {
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  const chart = <Line options={chartOptions} data={buildDeliveryStatDatasets(stats.delivery_histories)} />;
  ChartJS.defaults.color = '#bbb';

  return (
    <>
      <div className='about__header'>
        <p>Delivery statistics</p>

        {chart}
      </div>
    </>
  );
};

export default @connect(mapStateToProps)
@injectIntl
class InstanceStats extends React.PureComponent {

  static propTypes = {
    params: PropTypes.object.isRequired,
    domain: PropTypes.string,
    instance_stats: ImmutablePropTypes.map,
    dispatch: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    multiColumn: PropTypes.bool,
  };

  componentDidMount() {
    const { dispatch, params } = this.props;
    dispatch(fetchInstanceStats(params.domain));
  }

  render() {
    const { multiColumn, intl, instance_stats } = this.props;
    const domain = this.props.params.domain;
    const isLoading = instance_stats.get('isLoading');
    const stats = instance_stats?.get('instance_stats');

    return (
      <Column bindToDocument={!multiColumn} label={intl.formatMessage(messages.title)}>
        <div className='scrollable about'>
          <div className='about__header'>
            <h1>{intl.formatMessage(messages.title)}</h1>
            <p>{isLoading ? <Skeleton width='10ch' /> : domain}</p>
          </div>

          {isLoading ? null : renderStats(stats.toJS())}

        </div>

        <Helmet>
          <title>{intl.formatMessage(messages.title)}</title>
          <meta name='robots' content='all' />
        </Helmet>
      </Column>
    );
  }

}
