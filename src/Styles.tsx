import {makeStyles} from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
    appBar: {
        position: 'relative',
        "font-size": 'calc(9px + 2vmin)',
        "display": 'flex',
        "flex-direction": 'column',
        "max-height":'7vmin',
    },
    layout: {
        width: 'auto',
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
        [theme.breakpoints.up(610 + theme.spacing(2) * 2)]: {
            width: 610,
            marginLeft: 'auto',
            marginRight: 'auto',
        },
    },
    paper: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3),
        padding: theme.spacing(2),
        [theme.breakpoints.up(610 + theme.spacing(3) * 2)]: {
            marginTop: theme.spacing(6),
            marginBottom: theme.spacing(6),
            padding: theme.spacing(3),
        },
    },
    buttons: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    button: {
        marginLeft: theme.spacing(0.5),
    },
    heading: {
        marginLeft: theme.spacing(0.5),
    }
}));
export default useStyles;