--
-- PostgreSQL database dump
--

-- Dumped from database version 15.5 (Ubuntu 15.5-0ubuntu0.23.04.1)
-- Dumped by pg_dump version 15.5 (Ubuntu 15.5-0ubuntu0.23.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


ALTER TABLE public."SequelizeMeta" OWNER TO eugene;

--
-- Name: chatMessages; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public."chatMessages" (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "chatId" integer,
    "messageId" integer
);


ALTER TABLE public."chatMessages" OWNER TO eugene;

--
-- Name: chatMessages_id_seq; Type: SEQUENCE; Schema: public; Owner: eugene
--

CREATE SEQUENCE public."chatMessages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."chatMessages_id_seq" OWNER TO eugene;

--
-- Name: chatMessages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eugene
--

ALTER SEQUENCE public."chatMessages_id_seq" OWNED BY public."chatMessages".id;


--
-- Name: chatUsers; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public."chatUsers" (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "userId" integer,
    "chatId" integer,
    "userTypeId" integer
);


ALTER TABLE public."chatUsers" OWNER TO eugene;

--
-- Name: chatUsers_id_seq; Type: SEQUENCE; Schema: public; Owner: eugene
--

CREATE SEQUENCE public."chatUsers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."chatUsers_id_seq" OWNER TO eugene;

--
-- Name: chatUsers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eugene
--

ALTER SEQUENCE public."chatUsers_id_seq" OWNED BY public."chatUsers".id;


--
-- Name: chats; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.chats OWNER TO eugene;

--
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: eugene
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chats_id_seq OWNER TO eugene;

--
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eugene
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- Name: files; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public.files (
    id integer NOT NULL,
    path character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.files OWNER TO eugene;

--
-- Name: files_id_seq; Type: SEQUENCE; Schema: public; Owner: eugene
--

CREATE SEQUENCE public.files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.files_id_seq OWNER TO eugene;

--
-- Name: files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eugene
--

ALTER SEQUENCE public.files_id_seq OWNED BY public.files.id;


--
-- Name: messageFiles; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public."messageFiles" (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "messageId" integer,
    "fileId" integer
);


ALTER TABLE public."messageFiles" OWNER TO eugene;

--
-- Name: messageFiles_id_seq; Type: SEQUENCE; Schema: public; Owner: eugene
--

CREATE SEQUENCE public."messageFiles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public."messageFiles_id_seq" OWNER TO eugene;

--
-- Name: messageFiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eugene
--

ALTER SEQUENCE public."messageFiles_id_seq" OWNED BY public."messageFiles".id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    "senderId" integer NOT NULL,
    content character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.messages OWNER TO eugene;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: eugene
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.messages_id_seq OWNER TO eugene;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eugene
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: userFriends; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public."userFriends" (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."userFriends" OWNER TO eugene;

--
-- Name: userTypes; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public."userTypes" (
    id integer NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."userTypes" OWNER TO eugene;

--
-- Name: users; Type: TABLE; Schema: public; Owner: eugene
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    "profileInfo" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO eugene;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: eugene
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO eugene;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: eugene
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: chatMessages id; Type: DEFAULT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatMessages" ALTER COLUMN id SET DEFAULT nextval('public."chatMessages_id_seq"'::regclass);


--
-- Name: chatUsers id; Type: DEFAULT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatUsers" ALTER COLUMN id SET DEFAULT nextval('public."chatUsers_id_seq"'::regclass);


--
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- Name: files id; Type: DEFAULT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.files ALTER COLUMN id SET DEFAULT nextval('public.files_id_seq'::regclass);


--
-- Name: messageFiles id; Type: DEFAULT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."messageFiles" ALTER COLUMN id SET DEFAULT nextval('public."messageFiles_id_seq"'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: SequelizeMeta; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public."SequelizeMeta" (name) FROM stdin;
\.


--
-- Data for Name: chatMessages; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public."chatMessages" (id, name, "createdAt", "updatedAt", "chatId", "messageId") FROM stdin;
29	asdawd	2024-04-26 11:07:04.673+06	2024-04-26 11:07:04.673+06	1	134
30	asdawd	2024-04-26 11:22:57.128+06	2024-04-26 11:22:57.128+06	1	135
31	awdawdaw	2024-04-26 11:23:02.228+06	2024-04-26 11:23:02.228+06	1	136
32	awdwa	2024-04-26 11:31:19.324+06	2024-04-26 11:31:19.324+06	1	137
\.


--
-- Data for Name: chatUsers; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public."chatUsers" (id, "createdAt", "updatedAt", "userId", "chatId", "userTypeId") FROM stdin;
\.


--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public.chats (id, title, "createdAt", "updatedAt") FROM stdin;
1	tester	2024-04-20 14:20:29.319+06	2024-04-20 14:20:29.319+06
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public.files (id, path, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: messageFiles; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public."messageFiles" (id, "createdAt", "updatedAt", "messageId", "fileId") FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public.messages (id, "senderId", content, "createdAt", "updatedAt") FROM stdin;
1	4	dfad	2024-04-13 13:53:28.461+06	2024-04-13 13:53:28.461+06
2	4	hello	2024-04-13 13:56:13.932+06	2024-04-13 13:56:13.932+06
3	1	\N	2024-04-17 11:01:40.933+06	2024-04-17 11:01:40.933+06
4	1	\N	2024-04-17 12:45:40.862+06	2024-04-17 12:45:40.862+06
5	1	\N	2024-04-17 12:46:39.229+06	2024-04-17 12:46:39.229+06
6	1	\N	2024-04-17 13:02:36.299+06	2024-04-17 13:02:36.299+06
7	1	\N	2024-04-17 13:03:08.089+06	2024-04-17 13:03:08.089+06
8	1	\N	2024-04-17 13:08:38.021+06	2024-04-17 13:08:38.021+06
9	1	\N	2024-04-17 13:08:44.007+06	2024-04-17 13:08:44.007+06
10	1	\N	2024-04-17 13:10:14.666+06	2024-04-17 13:10:14.666+06
11	1	\N	2024-04-17 13:10:50.037+06	2024-04-17 13:10:50.037+06
12	1	\N	2024-04-17 13:11:29.68+06	2024-04-17 13:11:29.68+06
13	1	\N	2024-04-17 13:11:53.109+06	2024-04-17 13:11:53.109+06
14	1	\N	2024-04-17 13:11:54.73+06	2024-04-17 13:11:54.73+06
15	1	\N	2024-04-17 13:11:55.201+06	2024-04-17 13:11:55.201+06
16	1	\N	2024-04-17 13:11:55.457+06	2024-04-17 13:11:55.457+06
17	1	\N	2024-04-17 13:11:55.628+06	2024-04-17 13:11:55.628+06
18	1	\N	2024-04-17 13:11:55.858+06	2024-04-17 13:11:55.858+06
19	1	\N	2024-04-17 13:11:56.085+06	2024-04-17 13:11:56.085+06
20	1	\N	2024-04-17 13:11:56.443+06	2024-04-17 13:11:56.443+06
21	1	\N	2024-04-17 13:11:56.611+06	2024-04-17 13:11:56.611+06
22	1	\N	2024-04-17 13:11:56.951+06	2024-04-17 13:11:56.951+06
23	1	\N	2024-04-17 13:11:57.113+06	2024-04-17 13:11:57.113+06
24	1	\N	2024-04-17 13:11:57.279+06	2024-04-17 13:11:57.279+06
25	1	\N	2024-04-17 13:11:57.456+06	2024-04-17 13:11:57.456+06
26	1	\N	2024-04-17 13:12:02.776+06	2024-04-17 13:12:02.776+06
27	1	\N	2024-04-17 13:12:20.112+06	2024-04-17 13:12:20.112+06
28	1	\N	2024-04-17 13:13:05.785+06	2024-04-17 13:13:05.785+06
29	1	\N	2024-04-17 13:13:25.464+06	2024-04-17 13:13:25.464+06
30	1	123	2024-04-17 17:45:08.501+06	2024-04-17 17:45:08.501+06
31	1	s	2024-04-17 17:46:24.373+06	2024-04-17 17:46:24.373+06
32	1		2024-04-17 17:46:25.714+06	2024-04-17 17:46:25.714+06
33	1	d	2024-04-17 17:55:09.012+06	2024-04-17 17:55:09.012+06
34	1	dsa	2024-04-17 17:55:45.756+06	2024-04-17 17:55:45.756+06
35	1	ds	2024-04-17 17:56:19.756+06	2024-04-17 17:56:19.756+06
36	1	sad	2024-04-17 17:58:06.34+06	2024-04-17 17:58:06.34+06
37	1	dsada	2024-04-17 17:58:28.549+06	2024-04-17 17:58:28.549+06
38	1	haha	2024-04-17 17:58:38.605+06	2024-04-17 17:58:38.605+06
39	1	sda	2024-04-17 18:11:52.441+06	2024-04-17 18:11:52.441+06
40	1	Hello motherfucker!	2024-04-17 18:12:27.967+06	2024-04-17 18:12:27.967+06
41	1	Wussup	2024-04-17 18:12:51.405+06	2024-04-17 18:12:51.405+06
42	1	sda	2024-04-17 18:18:24.369+06	2024-04-17 18:18:24.369+06
43	1	dsafsa	2024-04-17 18:18:31.542+06	2024-04-17 18:18:31.542+06
44	1	Hi	2024-04-17 18:19:21.405+06	2024-04-17 18:19:21.405+06
45	12	asdas	2024-04-17 18:23:58.008+06	2024-04-17 18:23:58.008+06
46	5	sad	2024-04-17 18:25:25.301+06	2024-04-17 18:25:25.301+06
47	12	hi	2024-04-17 18:25:29.872+06	2024-04-17 18:25:29.872+06
48	12	ds	2024-04-17 18:30:53.583+06	2024-04-17 18:30:53.583+06
49	12	ds	2024-04-17 18:31:54.512+06	2024-04-17 18:31:54.512+06
50	12	as	2024-04-17 18:31:59.4+06	2024-04-17 18:31:59.4+06
51	12	fds	2024-04-17 18:32:31.456+06	2024-04-17 18:32:31.456+06
52	12	asd	2024-04-17 18:33:23.628+06	2024-04-17 18:33:23.628+06
53	12	sd	2024-04-17 18:34:07.953+06	2024-04-17 18:34:07.953+06
54	12	ds	2024-04-17 18:44:33.482+06	2024-04-17 18:44:33.482+06
55	5	asda	2024-04-17 18:44:42.499+06	2024-04-17 18:44:42.499+06
56	12	dsdasd	2024-04-17 18:44:49.759+06	2024-04-17 18:44:49.759+06
57	5	asd	2024-04-17 18:46:03.519+06	2024-04-17 18:46:03.519+06
58	12	duw	2024-04-17 20:49:12.68+06	2024-04-17 20:49:12.68+06
59	5	dsd	2024-04-17 20:49:25.965+06	2024-04-17 20:49:25.965+06
60	5	sd	2024-04-17 20:59:40.032+06	2024-04-17 20:59:40.032+06
61	12	sd	2024-04-17 21:00:44.776+06	2024-04-17 21:00:44.776+06
62	5	Hi	2024-04-18 10:42:17.033+06	2024-04-18 10:42:17.033+06
63	5		2024-04-18 10:42:17.256+06	2024-04-18 10:42:17.256+06
64	12	d	2024-04-18 10:42:28.367+06	2024-04-18 10:42:28.367+06
65	12	sad	2024-04-18 10:47:18.139+06	2024-04-18 10:47:18.139+06
66	12		2024-04-18 10:47:21.682+06	2024-04-18 10:47:21.682+06
67	12	ds	2024-04-18 10:47:24.454+06	2024-04-18 10:47:24.454+06
68	12	as	2024-04-18 10:47:29.646+06	2024-04-18 10:47:29.646+06
69	5	ss	2024-04-18 10:47:45.367+06	2024-04-18 10:47:45.367+06
70	12	sd	2024-04-18 10:49:08.806+06	2024-04-18 10:49:08.806+06
71	12	dsa	2024-04-18 10:51:47.236+06	2024-04-18 10:51:47.236+06
72	5	dsaa	2024-04-18 10:51:57.45+06	2024-04-18 10:51:57.45+06
73	12	hi	2024-04-18 10:52:34.806+06	2024-04-18 10:52:34.806+06
74	5	hi	2024-04-18 10:52:43.887+06	2024-04-18 10:52:43.887+06
75	5	dd	2024-04-18 10:53:20.564+06	2024-04-18 10:53:20.564+06
76	12	hi	2024-04-18 10:53:27.609+06	2024-04-18 10:53:27.609+06
77	5	hello	2024-04-18 10:53:33.093+06	2024-04-18 10:53:33.093+06
78	5	geko	2024-04-18 11:13:47.563+06	2024-04-18 11:13:47.563+06
79	7	w	2024-04-18 11:18:54.486+06	2024-04-18 11:18:54.486+06
80	7	dsa	2024-04-18 11:27:10.88+06	2024-04-18 11:27:10.88+06
81	5	hi	2024-04-18 11:27:25.159+06	2024-04-18 11:27:25.159+06
82	7	hihii	2024-04-18 11:27:37.421+06	2024-04-18 11:27:37.421+06
83	5	Hello, motherfucker!	2024-04-18 11:42:46.698+06	2024-04-18 11:42:46.698+06
84	12	What's up!	2024-04-18 11:43:01.979+06	2024-04-18 11:43:01.979+06
85	12	hi	2024-04-19 12:24:53.79+06	2024-04-19 12:24:53.79+06
86	5	все заебись, бро	2024-04-19 12:25:18.607+06	2024-04-19 12:25:18.607+06
87	12	asd	2024-04-19 14:17:42.136+06	2024-04-19 14:17:42.136+06
88	12	dasd	2024-04-19 16:56:08.816+06	2024-04-19 16:56:08.816+06
89	12	sds	2024-04-19 17:21:55.887+06	2024-04-19 17:21:55.887+06
90	12	dd	2024-04-19 17:24:52.868+06	2024-04-19 17:24:52.868+06
91	12	d	2024-04-19 17:26:08.319+06	2024-04-19 17:26:08.319+06
92	12	ds	2024-04-19 17:27:50.696+06	2024-04-19 17:27:50.696+06
93	5	hello	2024-04-19 17:30:58.039+06	2024-04-19 17:30:58.039+06
94	12	heloo	2024-04-19 17:31:04.095+06	2024-04-19 17:31:04.095+06
95	12	sd	2024-04-20 13:35:42.21+06	2024-04-20 13:35:42.21+06
96	12	asfasdgad	2024-04-20 13:35:57.982+06	2024-04-20 13:35:57.982+06
97	12	ds	2024-04-20 13:43:03.769+06	2024-04-20 13:43:03.769+06
98	12	ds	2024-04-20 13:43:40.158+06	2024-04-20 13:43:40.158+06
99	12	ds	2024-04-20 13:45:25.975+06	2024-04-20 13:45:25.975+06
100	12	вы	2024-04-20 13:49:07.067+06	2024-04-20 13:49:07.067+06
101	12	ds	2024-04-20 13:50:47.524+06	2024-04-20 13:50:47.524+06
102	12	ds	2024-04-20 13:58:23.687+06	2024-04-20 13:58:23.687+06
103	12	ds	2024-04-20 14:00:59.609+06	2024-04-20 14:00:59.609+06
104	12	sdssss	2024-04-20 14:08:37.425+06	2024-04-20 14:08:37.425+06
105	12	ds	2024-04-20 14:08:52.099+06	2024-04-20 14:08:52.099+06
106	12	ds	2024-04-20 14:16:18.025+06	2024-04-20 14:16:18.025+06
107	12	ds	2024-04-20 14:19:28.115+06	2024-04-20 14:19:28.115+06
108	12	ds	2024-04-20 14:20:29.349+06	2024-04-20 14:20:29.349+06
109	12	ds	2024-04-20 14:20:56.694+06	2024-04-20 14:20:56.694+06
110	12	ds	2024-04-20 14:21:05.566+06	2024-04-20 14:21:05.566+06
111	12	ds	2024-04-20 14:32:51.681+06	2024-04-20 14:32:51.681+06
112	12	ds	2024-04-20 14:39:16.047+06	2024-04-20 14:39:16.047+06
113	12	hello	2024-04-20 14:39:50.542+06	2024-04-20 14:39:50.542+06
114	12	d	2024-04-20 14:39:58.364+06	2024-04-20 14:39:58.364+06
115	7	aihdioawjd	2024-04-20 14:59:11.536+06	2024-04-20 14:59:11.536+06
116	6	opawkfpokawdpo	2024-04-20 14:59:40.129+06	2024-04-20 14:59:40.129+06
117	6	asdad	2024-04-20 15:09:26.452+06	2024-04-20 15:09:26.452+06
118	12		2024-04-23 14:04:39.056+06	2024-04-23 14:04:39.056+06
119	12	хелло	2024-04-23 14:10:52.85+06	2024-04-23 14:10:52.85+06
120	12	привет	2024-04-23 14:10:59.574+06	2024-04-23 14:10:59.574+06
121	12		2024-04-23 14:11:05.902+06	2024-04-23 14:11:05.902+06
122	12		2024-04-23 14:14:33.351+06	2024-04-23 14:14:33.351+06
123	12		2024-04-23 14:14:33.723+06	2024-04-23 14:14:33.723+06
124	12		2024-04-23 14:14:33.937+06	2024-04-23 14:14:33.937+06
125	12		2024-04-23 14:14:34.092+06	2024-04-23 14:14:34.092+06
126	12		2024-04-23 14:14:34.343+06	2024-04-23 14:14:34.343+06
127	12	adiowefoiwjfo[iwer	2024-04-26 10:34:24.803+06	2024-04-26 10:34:24.803+06
128	12	afsdfes	2024-04-26 10:34:26.528+06	2024-04-26 10:34:26.528+06
129	12	esfsefeafe	2024-04-26 10:34:28.608+06	2024-04-26 10:34:28.608+06
130	12	ds	2024-04-26 10:41:45.339+06	2024-04-26 10:41:45.339+06
131	12	ewrwq	2024-04-26 10:41:58.354+06	2024-04-26 10:41:58.354+06
132	12	123	2024-04-26 10:58:13.591+06	2024-04-26 10:58:13.591+06
133	12	12312	2024-04-26 10:58:17.317+06	2024-04-26 10:58:17.317+06
134	15	asdawd	2024-04-26 11:07:04.662+06	2024-04-26 11:07:04.662+06
135	12	asdawd	2024-04-26 11:22:57.105+06	2024-04-26 11:22:57.105+06
136	12	awdawdaw	2024-04-26 11:23:02.221+06	2024-04-26 11:23:02.221+06
137	20	awdwa	2024-04-26 11:31:19.3+06	2024-04-26 11:31:19.3+06
\.


--
-- Data for Name: userFriends; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public."userFriends" (id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: userTypes; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public."userTypes" (id, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: eugene
--

COPY public.users (id, name, email, password, "profileInfo", "createdAt", "updatedAt") FROM stdin;
1	eugene	user@email.org	$2b$05$9oz3m372/m/5Z.1hI91Xi.x6gbZACpH65DQwKqKzn87tuqe4GU5gK	\N	2024-04-12 12:24:13.358+06	2024-04-12 12:24:13.358+06
2	bulbash	bulba@email.org	$2b$05$e7mbPVeuDD1OJ1sGnxltPOayXxR/QzAwAYen8lOU2G/lFiIYw3BFm	\N	2024-04-12 12:37:07.04+06	2024-04-12 12:37:07.04+06
3	king	jeka@ia.io	$2b$05$4UCgK6aEJN2eFdsrejsBJe0Jvf.f2ISlqYL8bnsghu/kL2cBGaH/C	\N	2024-04-12 14:11:35.342+06	2024-04-12 14:11:35.342+06
4	jinux	jinux@gmail.com	$2b$05$Yp3u5epCu2xrEPUAOo/Vmut51euFFny.RTp990PiTWFuYGJqGsptq	\N	2024-04-12 14:30:13.79+06	2024-04-12 14:30:13.79+06
5	Maxim	maxim@gmail.com	$2b$05$BzQsBGRHHQBfichrfm5j2.wyTJ88g9MnUePz2bl2fmxlLmUXXnzLu	\N	2024-04-16 22:43:08.083+06	2024-04-16 22:43:08.083+06
6	Arseniy	arseniy@gmail.com	$2b$05$PSr80VThOdnq846kqcdV0erdXDoTgCo3RugcuHOSfkbTMTGQhRe8.	\N	2024-04-16 22:44:09.804+06	2024-04-16 22:44:09.804+06
7	kirill	kirill@gmail.com	$2b$05$T4vxAqb1v16CN1uiVT.TaOlTm2ckIYk0gtvBOlXioqwX9ycjFdCDK	\N	2024-04-16 23:20:25.637+06	2024-04-16 23:20:25.637+06
8	zhenya	zhenya@gmail.com	$2b$05$VfAy19nxLJr800TyDDJziua.3e560S7e57TwLSNW.lAoiYbHbmbWG	\N	2024-04-16 23:34:43.288+06	2024-04-16 23:34:43.288+06
9	jeka	jeka@gmail.com	$2b$05$aLVFOTu7EKTM99sMkq3FbutOqgtCZPbDR9ju9LhO3y6gntvaaMPqO	\N	2024-04-17 00:21:19.665+06	2024-04-17 00:21:19.665+06
10	kaha	kaha@gmail.com	$2b$05$EvOktxIxE0w.oyeURwlx8udoANVV./MQD7IRbupCV4vdQAfdncXxK	\N	2024-04-17 00:56:24.317+06	2024-04-17 00:56:24.317+06
11	eugene	eugeneS@gmail.com	$2b$05$iRzO1WLbOWHVu3Y2UbBLheH3SHxGesCNTXALwwIzAQ6RO6QGkqXA2	\N	2024-04-17 03:54:03.204+06	2024-04-17 03:54:03.204+06
12	eugene	Eugenes@gmail.com	$2b$05$tp9QmqSmQycvCSgpTFL6k.RlsI7GlNGcMKlsaDCj5IZbcmEF3ahS.	\N	2024-04-17 03:58:10.852+06	2024-04-17 03:58:10.852+06
13	joker	joker@gmail.com	$2b$05$W8YExlgbHqXNn26yY2OUI.BwO5AB8z1mJWgEbM8eQwYrcDypFK9He	\N	2024-04-26 10:40:43.603+06	2024-04-26 10:40:43.603+06
14	gal	gal@gmail.com	$2b$05$XyDkM1pR8jxgn00cqQpQFetMRdhrB22X5VdXEwx79fwT768QttjJe	\N	2024-04-26 10:58:52.093+06	2024-04-26 10:58:52.093+06
15	her	her@gmail.com	$2b$05$SVk4njoaJ.Wi283WbOt.0OsMUXm3mQPRId/2nd8VrxZyzQBWmmScm	\N	2024-04-26 11:05:29.959+06	2024-04-26 11:05:29.959+06
16	kol	kol@gmail.com	$2b$05$uLAmSwfKSQESgYD6bk0X..9vV7BDozahf/FNSL3uZUp0KLpuWukrS	\N	2024-04-26 11:12:38.818+06	2024-04-26 11:12:38.818+06
17	kek	kek@gmail.com	$2b$05$YNI/YDWKzDwaDw7ZrvgVeO51KZ5ntRQEVHV0raUwkYIwKyodsQLf2	\N	2024-04-26 11:13:22.496+06	2024-04-26 11:13:22.496+06
18	kik	kik@gmail.com	$2b$05$9eXkiN.j019VgOspncHLdOYfqnPZyOO218cZDyZsxir1W6TFoR8I2	\N	2024-04-26 11:15:07.089+06	2024-04-26 11:15:07.089+06
19	kok	kok@gmail.com	$2b$05$lYdxLxu4/ITCUZcea4QYleWj7eLHqBAPjrHZI23jNtQsrZfUbEbJi	\N	2024-04-26 11:22:13.387+06	2024-04-26 11:22:13.387+06
20	jok	jok@gmail.com	$2b$05$Woxhql/qM7V4IJcg6NxzveRQShBod7vq2WtD6cXknQj3QxkGYXEqm	\N	2024-04-26 11:31:10.109+06	2024-04-26 11:31:10.109+06
\.


--
-- Name: chatMessages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eugene
--

SELECT pg_catalog.setval('public."chatMessages_id_seq"', 32, true);


--
-- Name: chatUsers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eugene
--

SELECT pg_catalog.setval('public."chatUsers_id_seq"', 1, false);


--
-- Name: chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eugene
--

SELECT pg_catalog.setval('public.chats_id_seq', 1, false);


--
-- Name: files_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eugene
--

SELECT pg_catalog.setval('public.files_id_seq', 1, false);


--
-- Name: messageFiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eugene
--

SELECT pg_catalog.setval('public."messageFiles_id_seq"', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eugene
--

SELECT pg_catalog.setval('public.messages_id_seq', 137, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: eugene
--

SELECT pg_catalog.setval('public.users_id_seq', 20, true);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: chatMessages chatMessages_chatId_messageId_key; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatMessages"
    ADD CONSTRAINT "chatMessages_chatId_messageId_key" UNIQUE ("chatId", "messageId");


--
-- Name: chatMessages chatMessages_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatMessages"
    ADD CONSTRAINT "chatMessages_pkey" PRIMARY KEY (id);


--
-- Name: chatUsers chatUsers_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatUsers"
    ADD CONSTRAINT "chatUsers_pkey" PRIMARY KEY (id);


--
-- Name: chatUsers chatUsers_userId_chatId_key; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatUsers"
    ADD CONSTRAINT "chatUsers_userId_chatId_key" UNIQUE ("userId", "chatId");


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: files files_path_key; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_path_key UNIQUE (path);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: messageFiles messageFiles_messageId_fileId_key; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."messageFiles"
    ADD CONSTRAINT "messageFiles_messageId_fileId_key" UNIQUE ("messageId", "fileId");


--
-- Name: messageFiles messageFiles_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."messageFiles"
    ADD CONSTRAINT "messageFiles_pkey" PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: userFriends userFriends_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."userFriends"
    ADD CONSTRAINT "userFriends_pkey" PRIMARY KEY (id);


--
-- Name: userTypes userTypes_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."userTypes"
    ADD CONSTRAINT "userTypes_pkey" PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: chatMessages chatMessages_chatId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatMessages"
    ADD CONSTRAINT "chatMessages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES public.chats(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chatMessages chatMessages_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatMessages"
    ADD CONSTRAINT "chatMessages_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chatUsers chatUsers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatUsers"
    ADD CONSTRAINT "chatUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chatUsers chatUsers_userTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."chatUsers"
    ADD CONSTRAINT "chatUsers_userTypeId_fkey" FOREIGN KEY ("userTypeId") REFERENCES public."userTypes"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: messageFiles messageFiles_fileId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."messageFiles"
    ADD CONSTRAINT "messageFiles_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES public.files(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: messageFiles messageFiles_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: eugene
--

ALTER TABLE ONLY public."messageFiles"
    ADD CONSTRAINT "messageFiles_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public.messages(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

